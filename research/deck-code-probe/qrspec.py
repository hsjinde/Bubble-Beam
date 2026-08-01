"""QR Code specification tables and GF(256) arithmetic.

Zero dependencies (stdlib only) -- this container cannot install packages,
so every layer of the pipeline is implemented here from the spec.

References used: ISO/IEC 18004 structure as commonly tabulated (block counts,
alignment positions, BCH generators). Tables are cross-checked in tests.py
against externally published values (e.g. the 1-Q "HELLO WORLD" codeword
vector and the 32 published format-information bit strings).
"""

# --- Error correction levels -------------------------------------------------
# Value is the 2-bit field written into format information.
ECL = {"L": 1, "M": 0, "Q": 3, "H": 2}
ECL_BY_BITS = {1: "L", 0: "M", 3: "Q", 2: "H"}
ECL_ORDER = ["L", "M", "Q", "H"]

# --- Encoding modes ----------------------------------------------------------
MODE_TERMINATOR = 0x0
MODE_NUMERIC = 0x1
MODE_ALNUM = 0x2
MODE_STRUCTURED_APPEND = 0x3
MODE_BYTE = 0x4
MODE_FNC1_FIRST = 0x5
MODE_ECI = 0x7
MODE_KANJI = 0x8
MODE_FNC1_SECOND = 0x9

MODE_NAMES = {
    0x0: "TERMINATOR",
    0x1: "NUMERIC",
    0x2: "ALPHANUMERIC",
    0x3: "STRUCTURED_APPEND",
    0x4: "BYTE",
    0x5: "FNC1_FIRST",
    0x7: "ECI",
    0x8: "KANJI",
    0x9: "FNC1_SECOND",
}

ALNUM_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"


def char_count_bits(mode, version):
    """Bit length of the character-count indicator for a mode at a version."""
    if version <= 9:
        idx = 0
    elif version <= 26:
        idx = 1
    else:
        idx = 2
    table = {
        MODE_NUMERIC: (10, 12, 14),
        MODE_ALNUM: (9, 11, 13),
        MODE_BYTE: (8, 16, 16),
        MODE_KANJI: (8, 10, 12),
    }
    if mode not in table:
        return 0
    return table[mode][idx]


# --- Error-correction block structure ---------------------------------------
# Indexed [level][version-1]. These two tables plus num_raw_data_modules()
# fully determine the block layout for every version/level combination.
ECC_CODEWORDS_PER_BLOCK = {
    "L": [7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30,
          28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
          30, 30, 30, 30],
    "M": [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26,
          26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
          28, 28, 28, 28],
    "Q": [13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28,
          26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
          30, 30, 30, 30],
    "H": [17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28,
          26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
          30, 30, 30, 30],
}

NUM_EC_BLOCKS = {
    "L": [1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10,
          12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    "M": [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17,
          18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    "Q": [1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23,
          23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    "H": [1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25,
          34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
}


def size_for_version(version):
    return version * 4 + 17


def num_raw_data_modules(version):
    """Modules available for data+EC codewords, i.e. excluding function patterns."""
    result = (16 * version + 128) * version + 64
    if version >= 2:
        num_align = version // 7 + 2
        result -= (25 * num_align - 10) * num_align - 55
        if version >= 7:
            result -= 36
    return result


def total_codewords(version):
    return num_raw_data_modules(version) // 8


def data_codewords(version, ecl):
    return total_codewords(version) - (
        ECC_CODEWORDS_PER_BLOCK[ecl][version - 1] * NUM_EC_BLOCKS[ecl][version - 1]
    )


def block_layout(version, ecl):
    """Return list of (data_len, ec_len) per block, in interleaving order."""
    num_blocks = NUM_EC_BLOCKS[ecl][version - 1]
    ec_len = ECC_CODEWORDS_PER_BLOCK[ecl][version - 1]
    total = total_codewords(version)
    short_len = total // num_blocks
    num_short = num_blocks - (total % num_blocks)
    out = []
    for i in range(num_blocks):
        blk_total = short_len if i < num_short else short_len + 1
        out.append((blk_total - ec_len, ec_len))
    return out


def alignment_positions(version):
    """Row/column centres of alignment patterns."""
    if version == 1:
        return []
    num_align = version // 7 + 2
    size = size_for_version(version)
    if version == 32:
        step = 26
    else:
        step = ((version * 4 + num_align * 2 + 1) // (num_align * 2 - 2)) * 2
    positions = []
    pos = size - 7
    while len(positions) < num_align - 1:
        positions.insert(0, pos)
        pos -= step
    positions.insert(0, 6)
    return positions


# --- BCH codes ---------------------------------------------------------------
FORMAT_GENERATOR = 0x537   # x^10+x^8+x^5+x^4+x^2+x+1
FORMAT_MASK = 0x5412
VERSION_GENERATOR = 0x1F25  # x^12+x^11+x^10+x^9+x^8+x^5+x^2+1


def _bch_remainder(data, generator, gen_deg):
    rem = data
    gen_bits = generator.bit_length()
    while rem.bit_length() > gen_deg:
        rem ^= generator << (rem.bit_length() - gen_bits)
    return rem


def format_bits(ecl, mask):
    """15-bit format information for an EC level and mask pattern."""
    data = (ECL[ecl] << 3) | mask
    rem = _bch_remainder(data << 10, FORMAT_GENERATOR, 10)
    return ((data << 10) | rem) ^ FORMAT_MASK


ALL_FORMAT_BITS = {
    format_bits(lvl, m): (lvl, m) for lvl in ECL_ORDER for m in range(8)
}


def version_bits(version):
    """18-bit version information (versions 7..40 only)."""
    rem = _bch_remainder(version << 12, VERSION_GENERATOR, 12)
    return (version << 12) | rem


ALL_VERSION_BITS = {version_bits(v): v for v in range(7, 41)}


# --- Format information placement -------------------------------------------
# Coordinates for format bit i, in both redundant copies. A negative index is
# an offset from the far edge (row/col n + value). Verified module-for-module
# against an independent encoder -- see compare_encoder.py.
FORMAT_VERTICAL = (
    [(i, 8) for i in range(6)]          # bits 0-5  : rows 0-5, column 8
    + [(7, 8), (8, 8)]                  # bits 6-7  : skip the timing row
    + [(-(15 - i), 8) for i in range(8, 15)]  # bits 8-14 : rows n-7 .. n-1
)

FORMAT_HORIZONTAL = (
    [(8, -(i + 1)) for i in range(8)]   # bits 0-7  : row 8, cols n-1 .. n-8
    + [(8, 7)]                          # bit  8    : row 8, col 7
    + [(8, 14 - i) for i in range(9, 15)]  # bits 9-14 : row 8, cols 5 .. 0
)


# --- Mask patterns -----------------------------------------------------------
MASK_FUNCS = [
    lambda i, j: (i + j) % 2 == 0,
    lambda i, j: i % 2 == 0,
    lambda i, j: j % 3 == 0,
    lambda i, j: (i + j) % 3 == 0,
    lambda i, j: (i // 2 + j // 3) % 2 == 0,
    lambda i, j: (i * j) % 2 + (i * j) % 3 == 0,
    lambda i, j: ((i * j) % 2 + (i * j) % 3) % 2 == 0,
    lambda i, j: ((i + j) % 2 + (i * j) % 3) % 2 == 0,
]


# --- GF(256) with primitive polynomial 0x11D ---------------------------------
GF_EXP = [0] * 512
GF_LOG = [0] * 256


def _init_gf():
    x = 1
    for i in range(255):
        GF_EXP[i] = x
        GF_LOG[x] = i
        x <<= 1
        if x & 0x100:
            x ^= 0x11D
    for i in range(255, 512):
        GF_EXP[i] = GF_EXP[i - 255]


_init_gf()


def gf_mul(a, b):
    if a == 0 or b == 0:
        return 0
    return GF_EXP[GF_LOG[a] + GF_LOG[b]]


def gf_div(a, b):
    if b == 0:
        raise ZeroDivisionError("GF(256) division by zero")
    if a == 0:
        return 0
    return GF_EXP[(GF_LOG[a] - GF_LOG[b]) % 255]


def gf_inv(a):
    if a == 0:
        raise ZeroDivisionError("GF(256) inverse of zero")
    return GF_EXP[255 - GF_LOG[a]]


def gf_pow(a, n):
    if a == 0:
        return 0
    return GF_EXP[(GF_LOG[a] * n) % 255]


def poly_mul(p, q):
    out = [0] * (len(p) + len(q) - 1)
    for i, a in enumerate(p):
        if a == 0:
            continue
        la = GF_LOG[a]
        for j, b in enumerate(q):
            if b:
                out[i + j] ^= GF_EXP[la + GF_LOG[b]]
    return out


def poly_eval(p, x):
    """Evaluate polynomial (highest degree first) at x."""
    y = 0
    for coef in p:
        y = gf_mul(y, x) ^ coef
    return y


def rs_generator_poly(degree):
    """Generator polynomial (x-a^0)(x-a^1)...(x-a^(degree-1))."""
    g = [1]
    for i in range(degree):
        g = poly_mul(g, [1, GF_EXP[i]])
    return g


def rs_encode(data, ec_len):
    """Return ec_len error-correction codewords for the given data codewords."""
    gen = rs_generator_poly(ec_len)
    remainder = [0] * ec_len
    for b in data:
        factor = b ^ remainder[0]
        remainder = remainder[1:] + [0]
        if factor:
            lf = GF_LOG[factor]
            for i, gcoef in enumerate(gen[1:]):
                if gcoef:
                    remainder[i] ^= GF_EXP[lf + GF_LOG[gcoef]]
    return remainder
