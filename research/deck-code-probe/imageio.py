"""Zero-dependency image I/O.

No Pillow/OpenCV available in this container (PyPI is blocked), so PNG is
decoded and encoded here directly. Anything that is not a PNG is converted to
PNG first by the headless Chromium bridge in chrome_bridge.py, which keeps this
module free of format-specific guesswork.
"""

import struct
import zlib


class Image:
    """8-bit RGBA raster."""

    __slots__ = ("width", "height", "data")

    def __init__(self, width, height, data):
        self.width = width
        self.height = height
        self.data = data  # bytearray, len = w*h*4, RGBA

    def pixel(self, x, y):
        i = (y * self.width + x) * 4
        return tuple(self.data[i:i + 4])

    def to_gray(self, background=255):
        """Luminance, alpha composited over `background`. Returns bytearray."""
        out = bytearray(self.width * self.height)
        d = self.data
        for i in range(self.width * self.height):
            r, g, b, a = d[i * 4], d[i * 4 + 1], d[i * 4 + 2], d[i * 4 + 3]
            if a != 255:
                r = (r * a + background * (255 - a)) // 255
                g = (g * a + background * (255 - a)) // 255
                b = (b * a + background * (255 - a)) // 255
            out[i] = (r * 299 + g * 587 + b * 114) // 1000
        return out

    def crop(self, x0, y0, x1, y1):
        x0 = max(0, x0); y0 = max(0, y0)
        x1 = min(self.width, x1); y1 = min(self.height, y1)
        w = x1 - x0
        h = y1 - y0
        out = bytearray(w * h * 4)
        for y in range(h):
            src = ((y0 + y) * self.width + x0) * 4
            out[y * w * 4:(y + 1) * w * 4] = self.data[src:src + w * 4]
        return Image(w, h, out)


# --- PNG decoding ------------------------------------------------------------
_CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}

# Adam7: (x_start, y_start, x_step, y_step)
_ADAM7 = [
    (0, 0, 8, 8), (4, 0, 8, 8), (0, 4, 4, 8), (2, 0, 4, 4),
    (0, 2, 2, 4), (1, 0, 2, 2), (0, 1, 1, 2),
]


def _paeth(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def _unfilter(raw, width, height, bpp, stride):
    """Reverse PNG scanline filters. `raw` includes one filter byte per row."""
    out = bytearray(height * stride)
    pos = 0
    prev = bytearray(stride)
    for y in range(height):
        ftype = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if ftype == 0:
            pass
        elif ftype == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif ftype == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ftype == 3:
            for i in range(stride):
                left = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 0xFF
        elif ftype == 4:
            for i in range(stride):
                left = line[i - bpp] if i >= bpp else 0
                upleft = prev[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + _paeth(left, prev[i], upleft)) & 0xFF
        else:
            raise ValueError("unknown PNG filter type %d" % ftype)
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return out


def _extract_samples(row_bytes, width, channels, bit_depth):
    """Yield per-pixel tuples of raw sample values from one unfiltered row."""
    if bit_depth == 8:
        for x in range(width):
            i = x * channels
            yield tuple(row_bytes[i:i + channels])
    elif bit_depth == 16:
        for x in range(width):
            i = x * channels * 2
            yield tuple(
                (row_bytes[i + c * 2] << 8) | row_bytes[i + c * 2 + 1]
                for c in range(channels)
            )
    else:  # 1, 2, 4 -- sub-byte samples, packed big-endian
        per_byte = 8 // bit_depth
        mask = (1 << bit_depth) - 1
        for x in range(width):
            vals = []
            for c in range(channels):
                idx = x * channels + c
                byte = row_bytes[idx // per_byte]
                shift = 8 - bit_depth * (idx % per_byte + 1)
                vals.append((byte >> shift) & mask)
            yield tuple(vals)


def read_png(path):
    with open(path, "rb") as fh:
        blob = fh.read()
    return decode_png(blob)


def decode_png(blob):
    if blob[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG file (bad signature)")
    pos = 8
    ihdr = None
    palette = None
    trns = None
    idat = bytearray()
    while pos < len(blob):
        (length,) = struct.unpack(">I", blob[pos:pos + 4])
        ctype = blob[pos + 4:pos + 8]
        body = blob[pos + 8:pos + 8 + length]
        pos += 12 + length
        if ctype == b"IHDR":
            ihdr = struct.unpack(">IIBBBBB", body)
        elif ctype == b"PLTE":
            palette = body
        elif ctype == b"tRNS":
            trns = body
        elif ctype == b"IDAT":
            idat += body
        elif ctype == b"IEND":
            break
    if ihdr is None:
        raise ValueError("PNG has no IHDR chunk")
    width, height, bit_depth, color_type, comp, filt, interlace = ihdr
    if comp != 0 or filt != 0:
        raise ValueError("unsupported PNG compression/filter method")
    if color_type not in _CHANNELS:
        raise ValueError("unsupported PNG colour type %d" % color_type)

    raw = zlib.decompress(bytes(idat))
    channels = _CHANNELS[color_type]
    out = bytearray(width * height * 4)

    def emit(x, y, samples):
        maxval = (1 << bit_depth) - 1
        if color_type == 3:
            idx = samples[0]
            r = palette[idx * 3]
            g = palette[idx * 3 + 1]
            b = palette[idx * 3 + 2]
            a = trns[idx] if trns is not None and idx < len(trns) else 255
        else:
            scale = 255 / maxval if maxval != 255 else 1
            vals = [int(round(v * scale)) if maxval != 255 else v for v in samples]
            if color_type == 0:
                r = g = b = vals[0]
                a = 255
            elif color_type == 4:
                r = g = b = vals[0]
                a = vals[1]
            elif color_type == 2:
                r, g, b = vals[0], vals[1], vals[2]
                a = 255
            else:
                r, g, b, a = vals[0], vals[1], vals[2], vals[3]
        o = (y * width + x) * 4
        out[o] = r
        out[o + 1] = g
        out[o + 2] = b
        out[o + 3] = a

    if interlace == 0:
        stride = (width * channels * bit_depth + 7) // 8
        bpp = max(1, channels * bit_depth // 8)
        pixels = _unfilter(raw, width, height, bpp, stride)
        for y in range(height):
            row = pixels[y * stride:(y + 1) * stride]
            for x, samples in enumerate(_extract_samples(row, width, channels, bit_depth)):
                emit(x, y, samples)
    elif interlace == 1:
        offset = 0
        for (xs, ys, xstep, ystep) in _ADAM7:
            pw = (width - xs + xstep - 1) // xstep
            ph = (height - ys + ystep - 1) // ystep
            if pw == 0 or ph == 0:
                continue
            stride = (pw * channels * bit_depth + 7) // 8
            bpp = max(1, channels * bit_depth // 8)
            chunk = raw[offset:offset + ph * (stride + 1)]
            offset += ph * (stride + 1)
            pixels = _unfilter(chunk, pw, ph, bpp, stride)
            for y in range(ph):
                row = pixels[y * stride:(y + 1) * stride]
                for x, samples in enumerate(_extract_samples(row, pw, channels, bit_depth)):
                    emit(xs + x * xstep, ys + y * ystep, samples)
    else:
        raise ValueError("unsupported PNG interlace method %d" % interlace)

    return Image(width, height, out)


# --- PNG encoding (for test images and debug dumps) --------------------------
def write_png(path, img):
    raw = bytearray()
    stride = img.width * 4
    for y in range(img.height):
        raw.append(0)
        raw += img.data[y * stride:(y + 1) * stride]
    ihdr = struct.pack(">IIBBBBB", img.width, img.height, 8, 6, 0, 0, 0)

    def chunk(tag, body):
        return (
            struct.pack(">I", len(body))
            + tag
            + body
            + struct.pack(">I", zlib.crc32(tag + body) & 0xFFFFFFFF)
        )

    blob = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as fh:
        fh.write(blob)


def from_gray(width, height, gray):
    out = bytearray(width * height * 4)
    for i, v in enumerate(gray):
        out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v
        out[i * 4 + 3] = 255
    return Image(width, height, out)


def from_matrix(matrix, scale=1, quiet=0):
    """Render a boolean module matrix (True = dark) as an Image."""
    n = len(matrix)
    size = (n + quiet * 2) * scale
    out = bytearray(b"\xff" * (size * size * 4))
    for i in range(size * size):
        out[i * 4 + 3] = 255
    for r in range(n):
        for c in range(n):
            if not matrix[r][c]:
                continue
            for dy in range(scale):
                for dx in range(scale):
                    y = (r + quiet) * scale + dy
                    x = (c + quiet) * scale + dx
                    o = (y * size + x) * 4
                    out[o] = out[o + 1] = out[o + 2] = 0
    return Image(size, size, out)


def load_image(path):
    """Load any image. PNG is decoded directly; others go through Chromium."""
    with open(path, "rb") as fh:
        head = fh.read(8)
    if head == b"\x89PNG\r\n\x1a\n":
        return read_png(path)
    from chrome_bridge import convert_to_png
    return decode_png(convert_to_png(path))
