"""QR Code encoder.

This exists purely to generate ground truth for the decoder: with no reference
implementation installable, the only way to know the decoder works is to feed
it codes whose payload we already know, across every version, EC level and mask.
tests.py additionally checks this encoder against externally published codeword
vectors so the two halves cannot be wrong in the same direction.
"""

import qrspec as S


class BitBuffer:
    def __init__(self):
        self.bits = []

    def put(self, value, length):
        for i in range(length - 1, -1, -1):
            self.bits.append((value >> i) & 1)

    def __len__(self):
        return len(self.bits)

    def to_bytes(self):
        out = bytearray()
        for i in range(0, len(self.bits), 8):
            byte = 0
            for j in range(8):
                byte <<= 1
                if i + j < len(self.bits):
                    byte |= self.bits[i + j]
            out.append(byte)
        return out


def _encode_numeric(data, buf):
    for i in range(0, len(data), 3):
        chunk = data[i:i + 3]
        buf.put(int(chunk), 1 + 3 * len(chunk))


def _encode_alnum(data, buf):
    for i in range(0, len(data), 2):
        chunk = data[i:i + 2]
        if len(chunk) == 2:
            v = S.ALNUM_CHARSET.index(chunk[0]) * 45 + S.ALNUM_CHARSET.index(chunk[1])
            buf.put(v, 11)
        else:
            buf.put(S.ALNUM_CHARSET.index(chunk[0]), 6)


def _encode_byte(data, buf):
    for b in data:
        buf.put(b, 8)


def _pick_mode(data):
    if isinstance(data, (bytes, bytearray)):
        try:
            text = data.decode("ascii")
        except UnicodeDecodeError:
            return S.MODE_BYTE, data
    else:
        text = data
        try:
            data = text.encode("utf-8")
        except UnicodeEncodeError:
            raise ValueError("cannot encode text")
    if text.isdigit():
        return S.MODE_NUMERIC, text
    if all(c in S.ALNUM_CHARSET for c in text):
        return S.MODE_ALNUM, text
    return S.MODE_BYTE, data


def _segment_bit_length(mode, payload, version):
    n = len(payload)
    body = {
        S.MODE_NUMERIC: (n // 3) * 10 + {0: 0, 1: 4, 2: 7}[n % 3],
        S.MODE_ALNUM: (n // 2) * 11 + (6 if n % 2 else 0),
        S.MODE_BYTE: n * 8,
    }[mode]
    return 4 + S.char_count_bits(mode, version) + body


def make_bitstream(data, version, ecl, mode=None):
    if mode is None:
        mode, payload = _pick_mode(data)
    else:
        payload = data
    buf = BitBuffer()
    buf.put(mode, 4)
    buf.put(len(payload), S.char_count_bits(mode, version))
    if mode == S.MODE_NUMERIC:
        _encode_numeric(payload, buf)
    elif mode == S.MODE_ALNUM:
        _encode_alnum(payload, buf)
    else:
        _encode_byte(payload, buf)

    capacity_bits = S.data_codewords(version, ecl) * 8
    if len(buf) > capacity_bits:
        raise ValueError(
            "payload needs %d bits, version %d-%s holds %d"
            % (len(buf), version, ecl, capacity_bits)
        )
    # Terminator, then pad to a byte boundary, then alternating pad codewords.
    for _ in range(min(4, capacity_bits - len(buf))):
        buf.put(0, 1)
    while len(buf) % 8:
        buf.put(0, 1)
    out = buf.to_bytes()
    pad = [0xEC, 0x11]
    i = 0
    while len(out) < capacity_bits // 8:
        out.append(pad[i % 2])
        i += 1
    return out


def interleave(data_cws, version, ecl):
    """Split into blocks, RS-encode each, then interleave data and EC."""
    layout = S.block_layout(version, ecl)
    blocks = []
    pos = 0
    for data_len, ec_len in layout:
        chunk = list(data_cws[pos:pos + data_len])
        pos += data_len
        blocks.append((chunk, S.rs_encode(chunk, ec_len)))

    out = []
    max_data = max(len(b[0]) for b in blocks)
    for i in range(max_data):
        for data, _ in blocks:
            if i < len(data):
                out.append(data[i])
    max_ec = max(len(b[1]) for b in blocks)
    for i in range(max_ec):
        for _, ec in blocks:
            if i < len(ec):
                out.append(ec[i])
    return out


def min_version(data, ecl, mode=None):
    if mode is None:
        mode, payload = _pick_mode(data)
    else:
        payload = data
    for v in range(1, 41):
        if _segment_bit_length(mode, payload, v) <= S.data_codewords(v, ecl) * 8:
            return v
    raise ValueError("payload too large for any QR version")


class Matrix:
    def __init__(self, version):
        self.version = version
        self.size = S.size_for_version(version)
        self.modules = [[False] * self.size for _ in range(self.size)]
        self.reserved = [[False] * self.size for _ in range(self.size)]

    def set(self, r, c, dark, reserved=True):
        self.modules[r][c] = dark
        self.reserved[r][c] = reserved

    def draw_function_patterns(self):
        n = self.size
        # Finder patterns + separators
        for (br, bc) in [(0, 0), (0, n - 7), (n - 7, 0)]:
            for dr in range(-1, 8):
                for dc in range(-1, 8):
                    r, c = br + dr, bc + dc
                    if not (0 <= r < n and 0 <= c < n):
                        continue
                    inside = 0 <= dr <= 6 and 0 <= dc <= 6
                    if inside:
                        ring = max(abs(dr - 3), abs(dc - 3))
                        dark = ring != 2
                    else:
                        dark = False
                    self.set(r, c, dark)
        # Timing patterns
        for i in range(8, n - 8):
            dark = i % 2 == 0
            self.set(6, i, dark)
            self.set(i, 6, dark)
        # Alignment patterns
        positions = S.alignment_positions(self.version)
        for i, r in enumerate(positions):
            for j, c in enumerate(positions):
                if (i == 0 and j == 0) or (i == 0 and j == len(positions) - 1) \
                        or (i == len(positions) - 1 and j == 0):
                    continue
                for dr in range(-2, 3):
                    for dc in range(-2, 3):
                        ring = max(abs(dr), abs(dc))
                        self.set(r + dr, c + dc, ring != 1)
        # Reserve format information areas (values written in draw_format).
        # The timing modules at (8,6)/(6,8) already carry real values -- the
        # guard keeps them from being cleared.
        for i in range(9):
            if not self.reserved[8][i]:
                self.set(8, i, False)
            if not self.reserved[i][8]:
                self.set(i, 8, False)
        for i in range(8):
            self.set(8, n - 1 - i, False)
            self.set(n - 1 - i, 8, False)  # (n-8,8) is the dark module
        # Version information
        if self.version >= 7:
            bits = S.version_bits(self.version)
            for i in range(18):
                bit = (bits >> i) & 1
                r, c = i // 3, n - 11 + i % 3
                self.set(r, c, bool(bit))
                self.set(c, r, bool(bit))

    def place_data(self, codewords):
        n = self.size
        bits = []
        for cw in codewords:
            for i in range(7, -1, -1):
                bits.append((cw >> i) & 1)
        idx = 0
        col = n - 1
        upward = True
        while col > 0:
            if col == 6:  # skip the vertical timing column
                col -= 1
            rows = range(n - 1, -1, -1) if upward else range(n)
            for r in rows:
                for c in (col, col - 1):
                    if self.reserved[r][c]:
                        continue
                    bit = bits[idx] if idx < len(bits) else 0
                    idx += 1
                    self.modules[r][c] = bool(bit)
            upward = not upward
            col -= 2
        return idx

    def apply_mask(self, mask):
        fn = S.MASK_FUNCS[mask]
        for r in range(self.size):
            for c in range(self.size):
                if not self.reserved[r][c] and fn(r, c):
                    self.modules[r][c] = not self.modules[r][c]

    def draw_format(self, ecl, mask):
        n = self.size
        bits = S.format_bits(ecl, mask)
        for i in range(15):
            bit = bool((bits >> i) & 1)
            # Vertical run: bits 0-7 down column 8 (skipping the timing row),
            # bits 8-14 up column 8 beside the bottom-left finder.
            r, c = S.FORMAT_VERTICAL[i]
            self.modules[r if r >= 0 else n + r][c] = bit
            # Horizontal run: bits 0-7 right-to-left from the far edge,
            # bits 8-14 leftwards from column 7 beside the top-left finder.
            r, c = S.FORMAT_HORIZONTAL[i]
            self.modules[r][c if c >= 0 else n + c] = bit
        # Dark module, always set, never part of the format bits.
        self.modules[n - 8][8] = True

    def penalty(self):
        n = self.size
        score = 0
        # Rule 1: runs of five or more same-coloured modules
        for line in list(self.modules) + [list(col) for col in zip(*self.modules)]:
            run = 1
            for i in range(1, n):
                if line[i] == line[i - 1]:
                    run += 1
                else:
                    if run >= 5:
                        score += 3 + (run - 5)
                    run = 1
            if run >= 5:
                score += 3 + (run - 5)
        # Rule 2: 2x2 blocks of one colour
        for r in range(n - 1):
            for c in range(n - 1):
                v = self.modules[r][c]
                if (self.modules[r][c + 1] == v and self.modules[r + 1][c] == v
                        and self.modules[r + 1][c + 1] == v):
                    score += 3
        # Rule 3: 1:1:3:1:1 pattern with four light modules either side
        pat_a = [True, False, True, True, True, False, True,
                 False, False, False, False]
        pat_b = list(reversed(pat_a))
        for line in list(self.modules) + [list(col) for col in zip(*self.modules)]:
            for i in range(n - 10):
                window = line[i:i + 11]
                if window == pat_a or window == pat_b:
                    score += 40
        # Rule 4: deviation from a 50% dark ratio
        dark = sum(sum(1 for v in row if v) for row in self.modules)
        ratio = dark * 100 // (n * n)
        score += 10 * min(abs(ratio - 50) // 5, abs((dark * 100 + n * n - 1) // (n * n) - 50) // 5)
        return score


def encode(data, ecl="M", version=None, mask=None, mode=None):
    """Build a QR matrix. Returns (matrix_bools, version, ecl, mask)."""
    if version is None:
        version = min_version(data, ecl, mode)
    data_cws = make_bitstream(data, version, ecl, mode)
    codewords = interleave(data_cws, version, ecl)

    best = None
    masks = range(8) if mask is None else [mask]
    for m in masks:
        mtx = Matrix(version)
        mtx.draw_function_patterns()
        mtx.place_data(codewords)
        mtx.apply_mask(m)
        mtx.draw_format(ecl, m)
        p = mtx.penalty()
        if best is None or p < best[0]:
            best = (p, m, mtx)
    _, chosen_mask, mtx = best
    return mtx.modules, version, ecl, chosen_mask
