"""Generate QR codes for validation against a real-world scanner.

Everything in tests.py is self-contained or checked against another software
implementation. The one thing that cannot be checked in this container is
whether a real scanner -- a phone camera, the thing that actually matters --
reads what our encoder produces. Each code below targets a specific risk rather
than just being another sample.
"""

import os
import sys

import qrspec as S
import qrencode
import qrdecode
import imageio

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scan-test")

CASES = [
    # (filename, payload, ec level, forced version, what this one is probing)
    ("code1-v1-L.png",
     b"PTCGP PROBE 1",  # v1-L byte mode holds at most 17 bytes
     "L", 1,
     "smallest symbol, no alignment pattern, no version info block"),

    ("code2-v2-M.png",
     b"PROBE 2 ~!@#$%^&*()_+{}",  # v2-M holds 26 bytes
     "M", 2,
     "byte mode with punctuation; first version that has an alignment pattern"),

    ("code3-v7-Q.png",
     b"PROBE 3 -- version 7 carries an explicit version "
     b"information block in two corners.",
     "Q", 7,
     "version information blocks (only present from version 7 up)"),

    ("code4-v10-H.png",
     b"PTCGP PROBE 4 -- level H, multiple alignment patterns and a different "
     b"block interleaving layout.",
     "H", 10,
     "level H interleaving across many blocks, multiple alignment patterns"),

    ("code5-utf8.png",
     "PTCGP PROBE 5 波加曼 ポッチャマ Piplup".encode("utf-8"),
     "M", None,
     "high bytes / UTF-8 payload, verifies byte mode is not ASCII-only"),

    ("code6-v15-H.png",
     b"PTCGP PROBE 6 -- version 15 at level H. This is the exact combination "
     b"where the reference implementation's block table disagreed with the "
     b"geometry, so a successful scan here settles which one was right.",
     "H", 15,
     "THE DECIDING ONE: v15-H, where our table and the reference disagreed"),
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = []
    all_ok = True

    for filename, payload, ecl, version, purpose in CASES:
        if version is not None:
            budget = S.data_codewords(version, ecl) * 8
            need = 4 + S.char_count_bits(S.MODE_BYTE, version) + len(payload) * 8
            if need > budget:
                print("%s: payload is %d bytes, version %d-%s holds %d"
                      % (filename, len(payload), version, ecl,
                         (budget - 4 - S.char_count_bits(S.MODE_BYTE, version)) // 8))
                all_ok = False
                continue
        modules, version, ecl, mask = qrencode.encode(
            payload, ecl=ecl, version=version, mask=None, mode=S.MODE_BYTE)
        size = len(modules)
        # Aim for a comfortable on-screen size without making the file huge.
        scale = max(4, min(12, 700 // size))
        img = imageio.from_matrix(modules, scale=scale, quiet=4)
        path = os.path.join(OUT_DIR, filename)
        imageio.write_png(path, img)

        # Never hand over a code we have not read back ourselves.
        try:
            result = qrdecode.decode_image(imageio.read_png(path))
            got = b"".join(s.get("bytes", b"") for s in result["segments"])
            selfcheck = "ok" if got == payload else "SELF-CHECK FAILED"
            if got != payload:
                all_ok = False
        except Exception as exc:
            selfcheck = "SELF-CHECK ERROR: %s" % exc
            all_ok = False

        manifest.append({
            "file": filename,
            "version": version,
            "ec": ecl,
            "mask": mask,
            "modules": size,
            "pixels": img.width,
            "bytes": len(payload),
            "selfcheck": selfcheck,
            "purpose": purpose,
            "payload": payload,
        })
        print("%-18s v%-2d %s mask%d  %3dx%-3d modules  %4dpx  %3d bytes  [%s]"
              % (filename, version, ecl, mask, size, size, img.width,
                 len(payload), selfcheck))

    lines = ["# Expected scan results", "",
             "Scan each file and compare what your scanner shows against the",
             "expected text below. Report anything that fails to scan at all,",
             "and anything whose text comes back different.", ""]
    for m in manifest:
        lines.append("## %s" % m["file"])
        lines.append("")
        lines.append("- QR version %d, level %s, mask %d, %d x %d modules"
                     % (m["version"], m["ec"], m["mask"], m["modules"], m["modules"]))
        lines.append("- probing: %s" % m["purpose"])
        lines.append("- expected text:")
        lines.append("")
        lines.append("```")
        lines.append(m["payload"].decode("utf-8", "replace"))
        lines.append("```")
        lines.append("")
    with open(os.path.join(OUT_DIR, "EXPECTED.md"), "w") as fh:
        fh.write("\n".join(lines))

    print("")
    print("wrote %d codes + EXPECTED.md to %s" % (len(manifest), OUT_DIR))
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
