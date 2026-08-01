"""Decode QR codes that have been through screenshot-like abuse.

This is the check that gives a later failure meaning. If the decoder only worked
on pristine renders, then failing on the game's Display Code would tell us
nothing -- it could just be JPEG artefacts. Every case here starts from a known
payload, so a failure is unambiguous.
"""

import os
import sys
import tempfile

import qrspec as S
import qrencode
import qrdecode
import imageio
import chrome_bridge

CASES = [
    # (label, scale, angle, blur, format, quality)
    ("pristine PNG",                1.00, 0.0, 0.0, "image/png", 1.0),
    ("downscaled to 50%",           0.50, 0.0, 0.0, "image/png", 1.0),
    ("downscaled to 35%",           0.35, 0.0, 0.0, "image/png", 1.0),
    ("upscaled 2x",                 2.00, 0.0, 0.0, "image/png", 1.0),
    ("JPEG quality 70",             1.00, 0.0, 0.0, "image/jpeg", 0.70),
    ("JPEG quality 40",             1.00, 0.0, 0.0, "image/jpeg", 0.40),
    ("JPEG quality 25",             1.00, 0.0, 0.0, "image/jpeg", 0.25),
    ("rotated 1.5 degrees",         1.00, 1.5, 0.0, "image/png", 1.0),
    ("rotated 7 degrees",           1.00, 7.0, 0.0, "image/png", 1.0),
    ("rotated 20 degrees",          1.00, 20.0, 0.0, "image/png", 1.0),
    ("blurred 0.8px",               1.00, 0.0, 0.8, "image/png", 1.0),
    ("blurred 1.5px",               1.00, 0.0, 1.5, "image/png", 1.0),
    ("50% + JPEG 50",               0.50, 0.0, 0.0, "image/jpeg", 0.50),
    ("rotated 3 deg + JPEG 60",     1.00, 3.0, 0.0, "image/jpeg", 0.60),
    ("60% + blur 0.6 + JPEG 55",    0.60, 0.0, 0.6, "image/jpeg", 0.55),
    ("2x + rotate 12 + JPEG 45",    2.00, 12.0, 0.0, "image/jpeg", 0.45),
]


def main():
    payload = bytes(range(1, 61))  # binary payload, exercises byte mode fully
    modules, version, ecl, mask = qrencode.encode(
        payload, ecl="M", version=None, mask=None, mode=S.MODE_BYTE)
    print("test code: version %d, level %s, mask %d, %d-byte binary payload"
          % (version, ecl, mask, len(payload)))

    tmpdir = tempfile.mkdtemp(prefix="qrdegrade-")
    base = os.path.join(tmpdir, "base.png")
    imageio.write_png(base, imageio.from_matrix(modules, scale=8, quiet=4))

    passed = 0
    failed = []
    for label, scale, angle, blur, fmt, quality in CASES:
        ext = ".jpg" if "jpeg" in fmt else ".png"
        path = os.path.join(tmpdir, "case" + ext)
        try:
            blob = chrome_bridge.render(base, scale=scale, angle=angle, blur=blur,
                                        fmt=fmt, quality=quality)
            with open(path, "wb") as fh:
                fh.write(blob)
            img = imageio.load_image(path)
            result = qrdecode.decode_image(img)
            got = b"".join(s.get("bytes", b"") for s in result["segments"])
            if got == payload:
                passed += 1
                print("PASS  %-28s %4dx%-4d  binarizer=%-12s rs_errors=%d"
                      % (label, img.width, img.height,
                         result["binarizer"], result["rs_errors_corrected"]))
            else:
                failed.append(label)
                print("FAIL  %-28s payload mismatch (%d bytes back)"
                      % (label, len(got)))
        except Exception as exc:
            failed.append(label)
            print("FAIL  %-28s %s" % (label, str(exc)[:150]))

    print("-" * 70)
    print("%d/%d degradation cases decoded" % (passed, len(CASES)))
    if failed:
        print("failed: %s" % ", ".join(failed))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
