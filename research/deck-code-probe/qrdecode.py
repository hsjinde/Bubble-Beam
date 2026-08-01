"""Standard QR Code decoder: image in, raw payload bytes out.

Deliberately reports raw bytes rather than a decoded string -- the whole point
of the exercise is to see the actual payload, including any non-printable
structure, not a prettified interpretation of it.

The geometric pipeline follows the well-known ZXing approach: binarize, locate
the three finder patterns by their 1:1:3:1:1 run signature, estimate the module
grid, refine with an alignment pattern, then sample through a perspective
transform. Format information and Reed-Solomon both act as oracles -- a wrong
guess about orientation or mask cannot produce a valid BCH format word followed
by blocks with all-zero syndromes, so the decoder is free to search over the
ambiguous conventions and report which one actually verified.
"""

import math

import qrspec as S
from qrencode import Matrix
from rsdecode import rs_correct, ReedSolomonError


class DecodeError(Exception):
    pass


# --- Binarization ------------------------------------------------------------
def otsu_threshold(gray):
    """Return the highest luminance level that counts as dark (inclusive)."""
    hist = [0] * 256
    for v in gray:
        hist[v] += 1
    total = len(gray)
    sum_all = sum(i * hist[i] for i in range(256))
    sum_b = 0
    w_b = 0
    best_var = -1.0
    best_t = 127
    for t in range(256):
        w_b += hist[t]
        if w_b == 0:
            continue
        w_f = total - w_b
        if w_f == 0:
            break
        sum_b += t * hist[t]
        m_b = sum_b / w_b
        m_f = (sum_all - sum_b) / w_f
        var = w_b * w_f * (m_b - m_f) ** 2
        if var > best_var:
            best_var = var
            best_t = t
    return best_t


def binarize_global(gray, width, height, threshold=None):
    if threshold is None:
        threshold = otsu_threshold(gray)
    return bytearray(1 if v <= threshold else 0 for v in gray), threshold


MIN_DYNAMIC_RANGE = 24


def binarize_adaptive(gray, width, height, block=16):
    """Block-local thresholding, for screenshots with gradients or glare.

    Follows the hybrid binarizer strategy: pick a black point per block from its
    min/max, fall back to a background assumption for flat blocks, then threshold
    each block against the average black point of its neighbourhood so the
    boundary moves smoothly across the image.
    """
    bw = max(1, (width + block - 1) // block)
    bh = max(1, (height + block - 1) // block)
    black_points = [[0] * bw for _ in range(bh)]

    for by in range(bh):
        for bx in range(bw):
            x0, y0 = bx * block, by * block
            x1, y1 = min(x0 + block, width), min(y0 + block, height)
            lo, hi = 255, 0
            for y in range(y0, y1):
                row = y * width
                for x in range(x0, x1):
                    v = gray[row + x]
                    if v < lo:
                        lo = v
                    if v > hi:
                        hi = v
            if hi - lo > MIN_DYNAMIC_RANGE:
                bp = (lo + hi) // 2
            else:
                # Flat block: assume background. min/2 leaves a uniformly white
                # block light and a uniformly black block dark.
                bp = lo // 2
                if by > 0 and bx > 0:
                    neighbour = (black_points[by - 1][bx]
                                 + 2 * black_points[by][bx - 1]
                                 + black_points[by - 1][bx - 1]) // 4
                    if lo < neighbour:
                        bp = neighbour
            black_points[by][bx] = bp

    out = bytearray(width * height)
    for by in range(bh):
        for bx in range(bw):
            # Average the black points over a 5x5 block neighbourhood.
            acc = 0
            n = 0
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    yy, xx = by + dy, bx + dx
                    if 0 <= yy < bh and 0 <= xx < bw:
                        acc += black_points[yy][xx]
                        n += 1
            thr = acc // n
            x0, y0 = bx * block, by * block
            x1, y1 = min(x0 + block, width), min(y0 + block, height)
            for y in range(y0, y1):
                row = y * width
                for x in range(x0, x1):
                    out[row + x] = 1 if gray[row + x] <= thr else 0
    return out


# --- Finder pattern detection ------------------------------------------------
class FinderPattern:
    __slots__ = ("x", "y", "module_size", "count")

    def __init__(self, x, y, module_size):
        self.x = x
        self.y = y
        self.module_size = module_size
        self.count = 1

    def merge(self, x, y, module_size):
        n = self.count
        self.x = (self.x * n + x) / (n + 1)
        self.y = (self.y * n + y) / (n + 1)
        self.module_size = (self.module_size * n + module_size) / (n + 1)
        self.count += 1

    def __repr__(self):
        return "Finder(x=%.1f, y=%.1f, module=%.2f, hits=%d)" % (
            self.x, self.y, self.module_size, self.count)


def _ratio_ok(counts):
    """Check a 5-run sequence against the 1:1:3:1:1 finder signature."""
    total = sum(counts)
    if total < 7:
        return False
    unit = total / 7.0
    tol = unit / 1.6
    return (abs(unit - counts[0]) < tol and abs(unit - counts[1]) < tol
            and abs(3 * unit - counts[2]) < 3 * tol
            and abs(unit - counts[3]) < tol and abs(unit - counts[4]) < tol)


def _center_from_runs(end, counts):
    return end - counts[4] - counts[3] - counts[2] / 2.0


def _cross_check_vertical(binary, width, height, cx, cy, max_count, orig_total):
    """Confirm a horizontal hit by walking the same pattern vertically."""
    counts = [0] * 5
    x = int(cx)
    y = int(cy)
    if not (0 <= x < width and 0 <= y < height):
        return None
    # centre run upward
    yy = y
    while yy >= 0 and binary[yy * width + x] and counts[2] <= max_count:
        counts[2] += 1
        yy -= 1
    if yy < 0:
        return None
    while yy >= 0 and not binary[yy * width + x] and counts[1] <= max_count:
        counts[1] += 1
        yy -= 1
    if yy < 0 or counts[1] > max_count:
        return None
    while yy >= 0 and binary[yy * width + x] and counts[0] <= max_count:
        counts[0] += 1
        yy -= 1
    if counts[0] > max_count:
        return None
    # downward
    yy = y + 1
    while yy < height and binary[yy * width + x] and counts[2] <= max_count:
        counts[2] += 1
        yy += 1
    if yy == height or counts[2] > max_count:
        return None
    while yy < height and not binary[yy * width + x] and counts[3] <= max_count:
        counts[3] += 1
        yy += 1
    if yy == height or counts[3] > max_count:
        return None
    while yy < height and binary[yy * width + x] and counts[4] <= max_count:
        counts[4] += 1
        yy += 1
    if counts[4] > max_count:
        return None
    total = sum(counts)
    if 5 * abs(total - orig_total) >= 2 * orig_total:
        return None
    if not _ratio_ok(counts):
        return None
    return _center_from_runs(yy, counts)


def _cross_check_horizontal(binary, width, height, cx, cy, max_count, orig_total):
    counts = [0] * 5
    x = int(cx)
    y = int(cy)
    row = y * width
    xx = x
    while xx >= 0 and binary[row + xx] and counts[2] <= max_count:
        counts[2] += 1
        xx -= 1
    if xx < 0:
        return None
    while xx >= 0 and not binary[row + xx] and counts[1] <= max_count:
        counts[1] += 1
        xx -= 1
    if xx < 0 or counts[1] > max_count:
        return None
    while xx >= 0 and binary[row + xx] and counts[0] <= max_count:
        counts[0] += 1
        xx -= 1
    if counts[0] > max_count:
        return None
    xx = x + 1
    while xx < width and binary[row + xx] and counts[2] <= max_count:
        counts[2] += 1
        xx += 1
    if xx == width or counts[2] > max_count:
        return None
    while xx < width and not binary[row + xx] and counts[3] <= max_count:
        counts[3] += 1
        xx += 1
    if xx == width or counts[3] > max_count:
        return None
    while xx < width and binary[row + xx] and counts[4] <= max_count:
        counts[4] += 1
        xx += 1
    if counts[4] > max_count:
        return None
    total = sum(counts)
    if 5 * abs(total - orig_total) >= orig_total:
        return None
    if not _ratio_ok(counts):
        return None
    return _center_from_runs(xx, counts)


def find_finder_patterns(binary, width, height):
    """Locate candidate finder patterns, most confident first."""
    found = []
    row_step = max(1, height // 256)
    y = row_step - 1
    while y < height:
        counts = [0] * 5
        state = 0
        row = y * width
        for x in range(width):
            dark = binary[row + x]
            if dark:
                if state % 2 == 1:  # was light, now dark
                    state += 1
                counts[state] += 1
            else:
                if state % 2 == 0:
                    if state == 4:
                        if _ratio_ok(counts):
                            cx = _center_from_runs(x, counts)
                            total = sum(counts)
                            cy = _cross_check_vertical(
                                binary, width, height, cx, y,
                                2 * counts[2], total)
                            if cy is not None:
                                cx2 = _cross_check_horizontal(
                                    binary, width, height, cx, cy,
                                    2 * counts[2], total)
                                if cx2 is not None:
                                    msize = total / 7.0
                                    for f in found:
                                        if (abs(f.x - cx2) < f.module_size
                                                and abs(f.y - cy) < f.module_size):
                                            f.merge(cx2, cy, msize)
                                            break
                                    else:
                                        found.append(FinderPattern(cx2, cy, msize))
                        counts = [counts[2], counts[3], counts[4], 1, 0]
                        state = 3
                    else:
                        state += 1
                        counts[state] += 1
                else:
                    counts[state] += 1
        # tail of the row
        if state == 4 and _ratio_ok(counts):
            cx = _center_from_runs(width, counts)
            total = sum(counts)
            cy = _cross_check_vertical(binary, width, height, cx, y, 2 * counts[2], total)
            if cy is not None:
                for f in found:
                    if abs(f.x - cx) < f.module_size and abs(f.y - cy) < f.module_size:
                        f.merge(cx, cy, total / 7.0)
                        break
                else:
                    found.append(FinderPattern(cx, cy, total / 7.0))
        y += row_step
    found.sort(key=lambda f: -f.count)
    return found


def order_finders(patterns):
    """Return (top_left, top_right, bottom_left) for three finder centres."""
    a, b, c = patterns[:3]

    def dist(p, q):
        return math.hypot(p.x - q.x, p.y - q.y)

    dab, dbc, dac = dist(a, b), dist(b, c), dist(a, c)
    # The corner is the point opposite the longest side (the hypotenuse).
    if dbc >= dab and dbc >= dac:
        top_left, p, q = a, b, c
    elif dac >= dab and dac >= dbc:
        top_left, p, q = b, a, c
    else:
        top_left, p, q = c, a, b
    cross = ((p.x - top_left.x) * (q.y - top_left.y)
             - (p.y - top_left.y) * (q.x - top_left.x))
    if cross > 0:
        return top_left, p, q
    return top_left, q, p


# --- Perspective transform ---------------------------------------------------
class Perspective:
    def __init__(self, m):
        self.m = m  # a11,a21,a31,a12,a22,a32,a13,a23,a33

    def apply(self, x, y):
        a11, a21, a31, a12, a22, a32, a13, a23, a33 = self.m
        den = a13 * x + a23 * y + a33
        return ((a11 * x + a21 * y + a31) / den,
                (a12 * x + a22 * y + a32) / den)

    def times(self, other):
        a = self.m
        b = other.m
        return Perspective([
            a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
            a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
            a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
            a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
            a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
            a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
            a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
            a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
            a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
        ])

    def adjoint(self):
        a = self.m
        return Perspective([
            a[4] * a[8] - a[5] * a[7], a[2] * a[7] - a[1] * a[8],
            a[1] * a[5] - a[2] * a[4],
            a[5] * a[6] - a[3] * a[8], a[0] * a[8] - a[2] * a[6],
            a[2] * a[3] - a[0] * a[5],
            a[3] * a[7] - a[4] * a[6], a[1] * a[6] - a[0] * a[7],
            a[0] * a[4] - a[1] * a[3],
        ])


def square_to_quad(x0, y0, x1, y1, x2, y2, x3, y3):
    dx3 = x0 - x1 + x2 - x3
    dy3 = y0 - y1 + y2 - y3
    if abs(dx3) < 1e-9 and abs(dy3) < 1e-9:
        return Perspective([x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0.0, 0.0, 1.0])
    dx1 = x1 - x2
    dx2 = x3 - x2
    dy1 = y1 - y2
    dy2 = y3 - y2
    denom = dx1 * dy2 - dx2 * dy1
    if abs(denom) < 1e-12:
        raise DecodeError("degenerate perspective transform")
    a13 = (dx3 * dy2 - dx2 * dy3) / denom
    a23 = (dx1 * dy3 - dx3 * dy1) / denom
    return Perspective([
        x1 - x0 + a13 * x1, x3 - x0 + a23 * x3, x0,
        y1 - y0 + a13 * y1, y3 - y0 + a23 * y3, y0,
        a13, a23, 1.0,
    ])


def quad_to_quad(src, dst):
    s = square_to_quad(*[v for pt in src for v in pt])
    d = square_to_quad(*[v for pt in dst for v in pt])
    return d.times(s.adjoint())


# --- Alignment pattern -------------------------------------------------------
def _runs_along(values):
    """Convert a 0/1 sequence into [(value, start, length), ...]."""
    runs = []
    if not values:
        return runs
    cur = values[0]
    start = 0
    for i in range(1, len(values)):
        if values[i] != cur:
            runs.append((cur, start, i - start))
            cur = values[i]
            start = i
    runs.append((cur, start, len(values) - start))
    return runs


def _triple_ok(a, b, c, module_size):
    """Three runs each roughly one module wide."""
    tol = max(1.0, module_size / 2.0)
    return (abs(a - module_size) <= tol and abs(b - module_size) <= tol
            and abs(c - module_size) <= tol)


def find_alignment(binary, width, height, cx, cy, module_size, allowance):
    """Locate an alignment pattern centre near (cx, cy).

    The centre row of a 5x5 alignment pattern reads dark-light-dark-light-dark,
    so the centre module sits in the middle of a light-dark-light triple whose
    runs are each about one module wide. Candidates are confirmed by the same
    test down the column before being accepted.
    """
    x0 = max(0, int(cx - allowance))
    x1 = min(width - 1, int(cx + allowance))
    y0 = max(0, int(cy - allowance))
    y1 = min(height - 1, int(cy + allowance))
    if x1 - x0 < 3 * module_size or y1 - y0 < 3 * module_size:
        return None

    best = None
    # Walk rows outward from the estimate so the nearest match wins ties.
    order = sorted(range(y0, y1 + 1), key=lambda y: abs(y - cy))
    for y in order:
        row = y * width
        runs = _runs_along([binary[row + x] for x in range(x0, x1 + 1)])
        for i in range(1, len(runs) - 1):
            if runs[i][0] != 1 or runs[i - 1][0] != 0 or runs[i + 1][0] != 0:
                continue
            if not _triple_ok(runs[i - 1][2], runs[i][2], runs[i + 1][2],
                              module_size):
                continue
            acx = x0 + runs[i][1] + runs[i][2] / 2.0

            # Vertical confirmation through the candidate centre.
            xi = int(round(acx))
            if not (0 <= xi < width):
                continue
            vy0 = max(0, int(y - 3 * module_size))
            vy1 = min(height - 1, int(y + 3 * module_size))
            col = _runs_along([binary[yy * width + xi] for yy in range(vy0, vy1 + 1)])
            hit = None
            for j in range(1, len(col) - 1):
                if col[j][0] != 1 or col[j - 1][0] != 0 or col[j + 1][0] != 0:
                    continue
                if not _triple_ok(col[j - 1][2], col[j][2], col[j + 1][2],
                                  module_size):
                    continue
                acy = vy0 + col[j][1] + col[j][2] / 2.0
                if abs(acy - y) <= module_size:
                    hit = acy
                    break
            if hit is None:
                continue
            d = math.hypot(acx - cx, hit - cy)
            if best is None or d < best[2]:
                best = (acx, hit, d)
        if best is not None and best[2] <= module_size:
            break
    if best is None:
        return None
    return best[0], best[1]


# --- Grid sampling -----------------------------------------------------------
def sample_grid(binary, width, height, transform, dimension):
    matrix = [[False] * dimension for _ in range(dimension)]
    for r in range(dimension):
        for c in range(dimension):
            x, y = transform.apply(c + 0.5, r + 0.5)
            xi, yi = int(round(x)), int(round(y))
            if not (0 <= xi < width and 0 <= yi < height):
                raise DecodeError(
                    "sampling fell outside the image at module (%d,%d)" % (r, c))
            matrix[r][c] = bool(binary[yi * width + xi])
    return matrix


# --- Format and version information -----------------------------------------
def _hamming(a, b):
    return bin(a ^ b).count("1")


def read_format_info(matrix):
    """Return (ecl, mask, copy_used, bit_errors) using whichever copy verifies."""
    n = len(matrix)
    results = []
    for name, coords in (("vertical", S.FORMAT_VERTICAL),
                         ("horizontal", S.FORMAT_HORIZONTAL)):
        bits = 0
        for i, (r, c) in enumerate(coords):
            rr = r if r >= 0 else n + r
            cc = c if c >= 0 else n + c
            if matrix[rr][cc]:
                bits |= 1 << i
        best = None
        for candidate, (ecl, mask) in S.ALL_FORMAT_BITS.items():
            d = _hamming(bits, candidate)
            if best is None or d < best[0]:
                best = (d, ecl, mask)
        if best[0] <= 3:
            results.append((best[0], best[1], best[2], name))
    if not results:
        raise DecodeError("format information did not match any valid BCH word")
    results.sort()
    d, ecl, mask, name = results[0]
    return ecl, mask, name, d


def read_version_info(matrix):
    n = len(matrix)
    if n < 45:
        return None
    bits = 0
    for i in range(18):
        r, c = i // 3, n - 11 + i % 3
        if matrix[r][c]:
            bits |= 1 << i
    best = None
    for candidate, version in S.ALL_VERSION_BITS.items():
        d = _hamming(bits, candidate)
        if best is None or d < best[0]:
            best = (d, version)
    if best[0] <= 3:
        return best[1]
    return None


# --- Codeword extraction -----------------------------------------------------
def extract_codewords(matrix, version, mask):
    """Unmask and read the interleaved codeword stream in placement order."""
    n = len(matrix)
    template = Matrix(version)
    template.draw_function_patterns()
    reserved = template.reserved
    fn = S.MASK_FUNCS[mask]

    bits = []
    col = n - 1
    upward = True
    while col > 0:
        if col == 6:
            col -= 1
        rows = range(n - 1, -1, -1) if upward else range(n)
        for r in rows:
            for c in (col, col - 1):
                if reserved[r][c]:
                    continue
                v = matrix[r][c]
                if fn(r, c):
                    v = not v
                bits.append(1 if v else 0)
        upward = not upward
        col -= 2

    codewords = []
    for i in range(0, len(bits) - 7, 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | bits[i + j]
        codewords.append(byte)
    return codewords


def deinterleave(codewords, version, ecl):
    """Undo the block interleaving, returning a list of (data, ec) per block."""
    layout = S.block_layout(version, ecl)
    total = sum(d + e for d, e in layout)
    if len(codewords) < total:
        raise DecodeError(
            "expected %d codewords, sampled %d" % (total, len(codewords)))
    codewords = codewords[:total]

    blocks = [[[], []] for _ in layout]
    pos = 0
    max_data = max(d for d, _ in layout)
    for i in range(max_data):
        for bi, (dlen, _) in enumerate(layout):
            if i < dlen:
                blocks[bi][0].append(codewords[pos])
                pos += 1
    max_ec = max(e for _, e in layout)
    for i in range(max_ec):
        for bi, (_, elen) in enumerate(layout):
            if i < elen:
                blocks[bi][1].append(codewords[pos])
                pos += 1
    return blocks


def correct_blocks(blocks):
    """Reed-Solomon each block. Returns (data_bytes, total_errors_corrected)."""
    out = bytearray()
    total_errors = 0
    for data, ec in blocks:
        corrected, errs = rs_correct(data + ec, len(ec))
        total_errors += errs
        out += bytes(corrected[:len(data)])
    return out, total_errors


# --- Bitstream parsing -------------------------------------------------------
class BitReader:
    def __init__(self, data):
        self.data = data
        self.pos = 0

    def remaining(self):
        return len(self.data) * 8 - self.pos

    def read(self, count):
        if count > self.remaining():
            raise DecodeError("bitstream exhausted")
        value = 0
        for _ in range(count):
            byte = self.data[self.pos >> 3]
            bit = (byte >> (7 - (self.pos & 7))) & 1
            value = (value << 1) | bit
            self.pos += 1
        return value


def parse_segments(data, version):
    """Parse the data codewords into segments. Never raises on trailing junk."""
    reader = BitReader(data)
    segments = []
    while reader.remaining() >= 4:
        mode = reader.read(4)
        if mode == S.MODE_TERMINATOR:
            break
        name = S.MODE_NAMES.get(mode, "UNKNOWN(0x%X)" % mode)
        try:
            if mode == S.MODE_ECI:
                first = reader.read(8)
                if first & 0x80 == 0:
                    eci = first
                elif first & 0xC0 == 0x80:
                    eci = ((first & 0x3F) << 8) | reader.read(8)
                else:
                    eci = ((first & 0x1F) << 16) | reader.read(16)
                segments.append({"mode": name, "eci": eci})
                continue
            if mode == S.MODE_STRUCTURED_APPEND:
                index = reader.read(4)
                total = reader.read(4)
                parity = reader.read(8)
                segments.append({"mode": name, "index": index,
                                 "total": total, "parity": parity})
                continue
            if mode in (S.MODE_FNC1_FIRST,):
                segments.append({"mode": name})
                continue
            if mode == S.MODE_FNC1_SECOND:
                segments.append({"mode": name, "app": reader.read(8)})
                continue

            count = reader.read(S.char_count_bits(mode, version))
            if mode == S.MODE_BYTE:
                raw = bytes(reader.read(8) for _ in range(count))
                segments.append({"mode": name, "count": count, "bytes": raw})
            elif mode == S.MODE_NUMERIC:
                digits = ""
                left = count
                while left >= 3:
                    digits += "%03d" % reader.read(10)
                    left -= 3
                if left == 2:
                    digits += "%02d" % reader.read(7)
                elif left == 1:
                    digits += "%01d" % reader.read(4)
                segments.append({"mode": name, "count": count,
                                 "bytes": digits.encode()})
            elif mode == S.MODE_ALNUM:
                text = ""
                left = count
                while left >= 2:
                    v = reader.read(11)
                    text += S.ALNUM_CHARSET[v // 45] + S.ALNUM_CHARSET[v % 45]
                    left -= 2
                if left == 1:
                    text += S.ALNUM_CHARSET[reader.read(6)]
                segments.append({"mode": name, "count": count,
                                 "bytes": text.encode()})
            elif mode == S.MODE_KANJI:
                raw = bytearray()
                for _ in range(count):
                    v = reader.read(13)
                    v = ((v // 0xC0) << 8) | (v % 0xC0)
                    v += 0x8140 if v < 0x1F00 else 0xC140
                    raw += bytes([(v >> 8) & 0xFF, v & 0xFF])
                segments.append({"mode": name, "count": count, "bytes": bytes(raw)})
            else:
                segments.append({"mode": name, "note": "unhandled mode, stopped"})
                break
        except DecodeError as exc:
            segments.append({"mode": name, "note": "truncated: %s" % exc})
            break
    return segments


# --- Top level ---------------------------------------------------------------
def decode_matrix(matrix, expect_version=None):
    """Decode a sampled boolean module matrix. Returns a result dict."""
    n = len(matrix)
    if (n - 17) % 4 != 0 or not (21 <= n <= 177):
        raise DecodeError("matrix size %d is not a valid QR dimension" % n)
    version = (n - 17) // 4
    ecl, mask, copy_used, fmt_errors = read_format_info(matrix)
    version_from_info = read_version_info(matrix)

    codewords = extract_codewords(matrix, version, mask)
    blocks = deinterleave(codewords, version, ecl)
    data, errors = correct_blocks(blocks)
    segments = parse_segments(data, version)
    return {
        "version": version,
        "version_info_field": version_from_info,
        "ec_level": ecl,
        "mask": mask,
        "format_copy": copy_used,
        "format_bit_errors": fmt_errors,
        "rs_errors_corrected": errors,
        "data_codewords": bytes(data),
        "segments": segments,
        "matrix": matrix,
    }


def transpose(matrix):
    return [list(row) for row in zip(*matrix)]


def decode_matrix_any_orientation(matrix):
    """Try the matrix as sampled and mirrored; RS/BCH decide which is real."""
    attempts = []
    for label, m in (("as-sampled", matrix), ("mirrored", transpose(matrix))):
        try:
            result = decode_matrix(m)
            result["orientation"] = label
            return result
        except (DecodeError, ReedSolomonError) as exc:
            attempts.append("%s: %s" % (label, exc))
    raise DecodeError("; ".join(attempts))


def decode_image(img, debug=None):
    """Full pipeline from an Image. Raises DecodeError with the reasons tried."""
    gray = img.to_gray()
    width, height = img.width, img.height
    errors = []

    binarizers = [
        ("otsu", lambda: binarize_global(gray, width, height)[0]),
        ("adaptive-16", lambda: binarize_adaptive(gray, width, height, 16)),
        ("adaptive-8", lambda: binarize_adaptive(gray, width, height, 8)),
        ("adaptive-32", lambda: binarize_adaptive(gray, width, height, 32)),
    ]
    for name, make_binary in binarizers:
        try:
            binary = make_binary()
        except Exception as exc:
            errors.append("%s: binarization failed: %s" % (name, exc))
            continue
        patterns = find_finder_patterns(binary, width, height)
        if debug is not None:
            debug.setdefault("finders", {})[name] = list(patterns[:6])
        if len(patterns) < 3:
            errors.append("%s: found %d finder patterns" % (name, len(patterns)))
            continue
        try:
            result = _decode_with_binary(binary, width, height, patterns)
            result["binarizer"] = name
            return result
        except (DecodeError, ReedSolomonError) as exc:
            errors.append("%s: %s" % (name, exc))
    raise DecodeError(" | ".join(errors))


def _decode_with_binary(binary, width, height, patterns):
    top_left, top_right, bottom_left = order_finders(patterns)
    module_size = (top_left.module_size + top_right.module_size
                   + bottom_left.module_size) / 3.0
    if module_size < 1.0:
        raise DecodeError("estimated module size %.2f px is too small" % module_size)

    dim_top = round(math.hypot(top_right.x - top_left.x,
                               top_right.y - top_left.y) / module_size) + 7
    dim_left = round(math.hypot(bottom_left.x - top_left.x,
                                bottom_left.y - top_left.y) / module_size) + 7
    dimension = (dim_top + dim_left) // 2
    candidates = []
    for d in (dimension, dimension - 1, dimension + 1, dimension - 2, dimension + 2):
        if d % 4 == 1 and 21 <= d <= 177:
            candidates.append(d)
    if not candidates:
        raise DecodeError("no plausible dimension near %d" % dimension)

    reasons = []
    for dim in candidates:
        version = (dim - 17) // 4
        alignment = None
        if version >= 2:
            positions = S.alignment_positions(version)
            # Bottom-right alignment centre, in module coordinates.
            expected = positions[-2] if len(positions) >= 2 else None
            br_x = top_right.x - top_left.x + bottom_left.x
            br_y = top_right.y - top_left.y + bottom_left.y
            correction = 1.0 - 3.0 / (dim - 7)
            est_x = top_left.x + correction * (br_x - top_left.x)
            est_y = top_left.y + correction * (br_y - top_left.y)
            for allowance in (4, 8, 16):
                alignment = find_alignment(binary, width, height, est_x, est_y,
                                           module_size, allowance * module_size)
                if alignment:
                    break
            _ = expected

        # Try the alignment-anchored transform first when we have one, but always
        # keep the plain parallelogram estimate as a fallback: a misdetected
        # alignment pattern would otherwise sink an otherwise readable code.
        br_x = top_right.x - top_left.x + bottom_left.x
        br_y = top_right.y - top_left.y + bottom_left.y
        variants = []
        if alignment:
            variants.append((
                "alignment",
                [(3.5, 3.5), (dim - 3.5, 3.5), (dim - 6.5, dim - 6.5), (3.5, dim - 3.5)],
                [(top_left.x, top_left.y), (top_right.x, top_right.y),
                 (alignment[0], alignment[1]), (bottom_left.x, bottom_left.y)],
            ))
        variants.append((
            "no-alignment",
            [(3.5, 3.5), (dim - 3.5, 3.5), (dim - 3.5, dim - 3.5), (3.5, dim - 3.5)],
            [(top_left.x, top_left.y), (top_right.x, top_right.y),
             (br_x, br_y), (bottom_left.x, bottom_left.y)],
        ))

        for label, src, dst in variants:
            try:
                transform = quad_to_quad(src, dst)
                matrix = sample_grid(binary, width, height, transform, dim)
                result = decode_matrix_any_orientation(matrix)
                result["dimension"] = dim
                result["module_size_px"] = module_size
                result["grid_anchor"] = label
                result["alignment_found"] = alignment is not None
                result["finders"] = [top_left, top_right, bottom_left]
                return result
            except (DecodeError, ReedSolomonError) as exc:
                reasons.append("dim=%d/%s: %s" % (dim, label, exc))
    raise DecodeError("; ".join(reasons))
