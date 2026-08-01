"""Compare our QR encoder against the independent reference implementation.

Reads the JSONL produced by gen_reference.cjs (Kazuhiko Arase's library, as
vendored inside npm) and rebuilds every matrix with our own encoder. A
module-for-module match across versions, EC levels and masks validates the
parts of the format that a self-round-trip cannot: data placement order, mask
function orientation, format-information layout, block interleaving and the
Reed-Solomon parameters.
"""

import hashlib
import json
import sys

import qrspec as S
from qrencode import Matrix, make_bitstream, interleave


def build_matrix(payload, version, ecl, mask):
    data_cws = make_bitstream(payload, version, ecl, mode=S.MODE_BYTE)
    codewords = interleave(data_cws, version, ecl)
    mtx = Matrix(version)
    mtx.draw_function_patterns()
    mtx.place_data(codewords)
    mtx.apply_mask(mask)
    mtx.draw_format(ecl, mask)
    return mtx


def matrix_digest(modules):
    rows = ["".join("1" if v else "0" for v in row) for row in modules]
    return hashlib.sha256("\n".join(rows).encode()).hexdigest()


def main():
    total = 0
    mismatches = []
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line)
        payload = bytes.fromhex(rec["payload_hex"])
        total += 1
        try:
            mtx = build_matrix(payload, rec["version"], rec["ec"], rec["mask"])
        except Exception as exc:  # capacity disagreement is itself a finding
            mismatches.append((rec, "EXCEPTION: %s" % exc))
            continue
        if mtx.size != rec["size"]:
            mismatches.append((rec, "size %d vs %d" % (mtx.size, rec["size"])))
            continue
        digest = matrix_digest(mtx.modules)
        if digest != rec["sha256"]:
            mismatches.append((rec, "digest %s vs %s" % (digest[:16], rec["sha256"][:16])))

    print("compared %d matrices" % total)
    if not mismatches:
        print("ALL MATCH")
        return 0
    print("MISMATCHES: %d" % len(mismatches))
    for rec, why in mismatches[:20]:
        print("  v%-2d %s mask%d len=%d : %s"
              % (rec["version"], rec["ec"], rec["mask"],
                 len(rec["payload_hex"]) // 2, why))
    return 1


if __name__ == "__main__":
    sys.exit(main())
