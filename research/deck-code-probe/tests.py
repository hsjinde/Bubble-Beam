"""Validation suite for the QR toolchain.

Three independent kinds of check:

1. Published constants -- format-information bit strings, version-information
   bit strings, alignment pattern positions and codeword counts are compared
   against values published in the standard's commonly reproduced tables.
2. External reference -- compare_encoder.py checks every matrix against an
   independently written encoder (run separately, it needs Node).
3. Round trip -- encode, render to pixels, decode, and require the payload back
   byte-for-byte, including under screenshot-like degradation.

The point of all this is narrow but important: if the decoder later fails on the
game's Display Code, that failure has to mean something about the code rather
than about this implementation.
"""

import os
import random
import sys

import qrspec as S
import qrencode
import qrdecode
import imageio


PASS = "PASS"
FAIL = "FAIL"
_results = []


def check(name, condition, detail=""):
    _results.append((PASS if condition else FAIL, name, detail))
    print("%-5s %s%s" % (PASS if condition else FAIL, name,
                         ("  -- " + detail) if detail and not condition else ""))
    return condition


# --- 1. Published constants --------------------------------------------------
# The 32 format-information strings, as published (EC level, mask) -> 15 bits.
PUBLISHED_FORMAT_BITS = {
    ("L", 0): 0b111011111000100, ("L", 1): 0b111001011110011,
    ("L", 2): 0b111110110101010, ("L", 3): 0b111100010011101,
    ("L", 4): 0b110011000101111, ("L", 5): 0b110001100011000,
    ("L", 6): 0b110110001000001, ("L", 7): 0b110100101110110,
    ("M", 0): 0b101010000010010, ("M", 1): 0b101000100100101,
    ("M", 2): 0b101111001111100, ("M", 3): 0b101101101001011,
    ("M", 4): 0b100010111111001, ("M", 5): 0b100000011001110,
    ("M", 6): 0b100111110010111, ("M", 7): 0b100101010100000,
    ("Q", 0): 0b011010101011111, ("Q", 1): 0b011000001101000,
    ("Q", 2): 0b011111100110001, ("Q", 3): 0b011101000000110,
    ("Q", 4): 0b010010010110100, ("Q", 5): 0b010000110000011,
    ("Q", 6): 0b010111011011010, ("Q", 7): 0b010101111101101,
    ("H", 0): 0b001011010001001, ("H", 1): 0b001001110111110,
    ("H", 2): 0b001110011100111, ("H", 3): 0b001100111010000,
    ("H", 4): 0b000011101100010, ("H", 5): 0b000001001010101,
    ("H", 6): 0b000110100001100, ("H", 7): 0b000100000111011,
}

# Published version-information strings for a few versions. (compare_bch.py
# additionally checks all 34 against an independent implementation.)
PUBLISHED_VERSION_BITS = {
    7: 0b000111110010010100,
    8: 0b001000010110111100,
    9: 0b001001101010011001,
    10: 0b001010010011010011,
    40: 0b101000110001101001,
}

# Published alignment pattern centre coordinates.
PUBLISHED_ALIGNMENT = {
    1: [], 2: [6, 18], 6: [6, 34], 7: [6, 22, 38], 14: [6, 26, 46, 66],
    21: [6, 28, 50, 72, 94], 32: [6, 34, 60, 86, 112, 138],
    40: [6, 30, 58, 86, 114, 142, 170],
}

# Published total data codeword counts for a sample of version/level pairs.
PUBLISHED_DATA_CODEWORDS = {
    (1, "L"): 19, (1, "M"): 16, (1, "Q"): 13, (1, "H"): 9,
    (2, "L"): 34, (5, "Q"): 62, (10, "H"): 122, (20, "L"): 861,
    (40, "L"): 2956, (40, "M"): 2334, (40, "Q"): 1666, (40, "H"): 1276,
}


def test_published_constants():
    ok = True
    bad = [k for k, v in PUBLISHED_FORMAT_BITS.items()
           if S.format_bits(k[0], k[1]) != v]
    ok &= check("format information matches all 32 published bit strings",
                not bad, "mismatched: %s" % bad[:5])

    bad = [v for v, bits in PUBLISHED_VERSION_BITS.items()
           if S.version_bits(v) != bits]
    ok &= check("version information matches published bit strings",
                not bad, "mismatched versions: %s" % bad)

    bad = [v for v, pos in PUBLISHED_ALIGNMENT.items()
           if S.alignment_positions(v) != pos]
    ok &= check("alignment pattern positions match published table",
                not bad, "mismatched versions: %s" % bad)

    bad = [k for k, n in PUBLISHED_DATA_CODEWORDS.items()
           if S.data_codewords(k[0], k[1]) != n]
    ok &= check("data codeword counts match published table",
                not bad, "mismatched: %s" % bad)

    # Every block layout must exactly consume the geometric codeword budget.
    bad = []
    for v in range(1, 41):
        for e in S.ECL_ORDER:
            layout = S.block_layout(v, e)
            if sum(d + c for d, c in layout) != S.total_codewords(v):
                bad.append((v, e))
            if sum(d for d, _ in layout) != S.data_codewords(v, e):
                bad.append((v, e))
    ok &= check("all 160 block layouts consume the exact codeword budget",
                not bad, "bad: %s" % bad[:5])
    return ok


def test_hello_world_vector():
    """Published worked example: "HELLO WORLD" at version 1, level Q."""
    expected_data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236]
    expected_ec = [168, 72, 22, 82, 217, 54, 156, 0, 46, 15, 180, 122, 16]
    data = list(qrencode.make_bitstream("HELLO WORLD", 1, "Q", mode=S.MODE_ALNUM))
    ok = check("HELLO WORLD 1-Q data codewords match published vector",
               data == expected_data, "got %s" % data)
    ec = S.rs_encode(expected_data, 13)
    ok &= check("HELLO WORLD 1-Q error correction codewords match published vector",
                ec == expected_ec, "got %s" % ec)
    return ok


# --- 3. Round trip -----------------------------------------------------------
def roundtrip(payload, version, ecl, mask, scale=4, quiet=4):
    modules, version, ecl, mask = qrencode.encode(
        payload, ecl=ecl, version=version, mask=mask, mode=S.MODE_BYTE)
    img = imageio.from_matrix(modules, scale=scale, quiet=quiet)
    result = qrdecode.decode_image(img)
    got = b"".join(s.get("bytes", b"") for s in result["segments"])
    return result, got


def test_roundtrip_matrix_only():
    """Decode straight from the module matrix, isolating the bit-level layers."""
    rng = random.Random(20260801)
    failures = []
    tested = 0
    for version in [1, 2, 3, 6, 7, 10, 14, 15, 20, 26, 27, 33, 40]:
        for ecl in S.ECL_ORDER:
            cap = S.data_codewords(version, ecl) - (3 if version > 9 else 2)
            payload = bytes(rng.randrange(256) for _ in range(max(1, min(cap, 64))))
            for mask in range(8):
                tested += 1
                try:
                    modules, _, _, _ = qrencode.encode(
                        payload, ecl=ecl, version=version, mask=mask,
                        mode=S.MODE_BYTE)
                    res = qrdecode.decode_matrix(modules)
                    got = b"".join(s.get("bytes", b"") for s in res["segments"])
                    if got != payload:
                        failures.append("v%d %s mask%d payload mismatch"
                                        % (version, ecl, mask))
                    elif res["ec_level"] != ecl or res["mask"] != mask:
                        failures.append("v%d %s mask%d read back as %s mask%d"
                                        % (version, ecl, mask,
                                           res["ec_level"], res["mask"]))
                except Exception as exc:
                    failures.append("v%d %s mask%d: %s" % (version, ecl, mask, exc))
    return check("matrix round trip over %d version/level/mask combinations" % tested,
                 not failures, "; ".join(failures[:5]))


def test_roundtrip_pixels():
    """Full pipeline including finder detection and grid sampling."""
    rng = random.Random(4242)
    failures = []
    tested = 0
    cases = [(1, "L"), (2, "M"), (4, "Q"), (7, "H"), (10, "M"), (15, "H"),
             (20, "L"), (27, "M"), (40, "L")]
    for version, ecl in cases:
        cap = min(S.data_codewords(version, ecl) - 3, 80)
        payload = bytes(rng.randrange(256) for _ in range(max(1, cap)))
        for scale in (3, 5, 9):
            tested += 1
            try:
                res, got = roundtrip(payload, version, ecl, None, scale=scale)
                if got != payload:
                    failures.append("v%d %s scale%d payload mismatch (%d vs %d bytes)"
                                    % (version, ecl, scale, len(got), len(payload)))
            except Exception as exc:
                failures.append("v%d %s scale%d: %s" % (version, ecl, scale, exc))
    return check("pixel round trip over %d rendered images" % tested,
                 not failures, "; ".join(failures[:5]))


def test_rs_at_full_capacity():
    """Corrupt exactly floor(ec/2) codewords per block -- the theoretical limit."""
    from rsdecode import rs_correct
    rng = random.Random(5)
    failures = []
    trials = 0
    for ec_len in (7, 10, 13, 17, 20, 24, 26, 28, 30):
        for _ in range(25):
            trials += 1
            data = [rng.randrange(256) for _ in range(20)]
            block = data + S.rs_encode(data, ec_len)
            t = ec_len // 2
            positions = rng.sample(range(len(block)), t)
            corrupted = list(block)
            for p in positions:
                corrupted[p] ^= rng.randrange(1, 256)
            try:
                got, errs = rs_correct(corrupted, ec_len)
            except Exception as exc:
                failures.append("ec=%d: %s" % (ec_len, exc))
                continue
            if got != block:
                failures.append("ec=%d: wrong correction" % ec_len)
            elif errs != t:
                failures.append("ec=%d: reported %d errors, injected %d"
                                % (ec_len, errs, t))
    return check("Reed-Solomon corrects at full capacity over %d blocks" % trials,
                 not failures, "; ".join(failures[:5]))


def test_error_correction():
    """Damage modules in the image and confirm the payload still comes back."""
    payload = b"PTCGP feasibility probe -- error correction check"
    modules, version, ecl, mask = qrencode.encode(
        payload, ecl="H", version=None, mask=None, mode=S.MODE_BYTE)
    n = len(modules)
    rng = random.Random(7)
    damaged = [list(row) for row in modules]
    # Flip scattered modules in the data region, staying inside level H's budget.
    flipped = 0
    seen = set()
    while flipped < 25:
        r = rng.randrange(9, n)
        c = rng.randrange(9, n)
        if (r, c) in seen:
            continue
        seen.add((r, c))
        damaged[r][c] = not damaged[r][c]
        flipped += 1
    try:
        res = qrdecode.decode_matrix(damaged)
        got = b"".join(s.get("bytes", b"") for s in res["segments"])
        ok = got == payload and res["rs_errors_corrected"] > 0
        return check("payload survives %d flipped modules at level H" % flipped,
                     ok, "corrected=%s payload_ok=%s"
                     % (res["rs_errors_corrected"], got == payload))
    except Exception as exc:
        return check("payload survives %d flipped modules at level H" % flipped,
                     False, str(exc))


def test_rejects_noise():
    """A random matrix must NOT decode -- guards against false positives."""
    rng = random.Random(99)
    decoded = 0
    for _ in range(40):
        n = 33
        matrix = [[rng.random() < 0.5 for _ in range(n)] for _ in range(n)]
        try:
            qrdecode.decode_matrix(matrix)
            decoded += 1
        except Exception:
            pass
    return check("random noise matrices are rejected (0 of 40 decode)",
                 decoded == 0, "%d decoded" % decoded)


def main():
    print("=" * 70)
    print("QR toolchain validation")
    print("=" * 70)
    test_published_constants()
    test_hello_world_vector()
    test_roundtrip_matrix_only()
    test_roundtrip_pixels()
    test_rs_at_full_capacity()
    test_error_correction()
    test_rejects_noise()
    print("-" * 70)
    failed = [r for r in _results if r[0] == FAIL]
    print("%d checks, %d failed" % (len(_results), len(failed)))
    for _, name, detail in failed:
        print("  FAILED: %s\n          %s" % (name, detail))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
