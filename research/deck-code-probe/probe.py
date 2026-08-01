"""Command line entry point for the Display Code investigation.

  python3 probe.py decode  <image> [image ...]   read codes, dump raw payloads
  python3 probe.py analyze <image>               structural analysis only
  python3 probe.py compare <image> <image> [...] decode several and diff payloads

`decode` falls back to `analyze` automatically when a code cannot be read, so a
single run always produces evidence either way.
"""

import os
import sys

import analyze as analyze_mod
import imageio
import qrdecode


def hexdump(data, width=16, indent="  "):
    lines = []
    for off in range(0, len(data), width):
        chunk = data[off:off + width]
        hexpart = " ".join("%02x" % b for b in chunk)
        hexpart += "   " * (width - len(chunk))
        ascii_part = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        lines.append("%s%08x  %s  |%s|" % (indent, off, hexpart, ascii_part))
    return "\n".join(lines)


def describe_result(result, path):
    out = []
    out.append("=" * 74)
    out.append("DECODED: %s" % path)
    out.append("=" * 74)
    out.append("  QR version            : %d  (%d x %d modules)"
               % (result["version"], result["dimension"], result["dimension"]))
    out.append("  error correction      : level %s" % result["ec_level"])
    out.append("  mask pattern          : %d" % result["mask"])
    out.append("  module size           : %.2f px" % result["module_size_px"])
    out.append("  binarizer / anchor    : %s / %s"
               % (result["binarizer"], result.get("grid_anchor")))
    out.append("  orientation           : %s" % result.get("orientation"))
    out.append("  format info read from : %s copy (%d bit errors corrected)"
               % (result["format_copy"], result["format_bit_errors"]))
    out.append("  RS symbols corrected  : %d  (0 = clean read)"
               % result["rs_errors_corrected"])
    if result.get("version_info_field") is not None:
        out.append("  version info field    : %d" % result["version_info_field"])

    out.append("")
    out.append("  SEGMENTS")
    for i, seg in enumerate(result["segments"]):
        detail = {k: v for k, v in seg.items() if k != "bytes"}
        out.append("    [%d] %s" % (i, detail))

    payload = b"".join(s.get("bytes", b"") for s in result["segments"])
    out.append("")
    out.append("  PAYLOAD (concatenated segment content): %d bytes" % len(payload))
    if payload:
        out.append(hexdump(payload, indent="    "))

    raw = result["data_codewords"]
    out.append("")
    out.append("  RAW DATA CODEWORDS (after Reed-Solomon, before segment parsing): "
               "%d bytes" % len(raw))
    out.append(hexdump(raw, indent="    "))
    return "\n".join(out), payload


def cmd_decode(paths, save_dir=None):
    payloads = {}
    for path in paths:
        try:
            img = imageio.load_image(path)
        except Exception as exc:
            print("FAILED to load %s: %s" % (path, exc))
            continue
        try:
            result = qrdecode.decode_image(img)
        except Exception as exc:
            print("=" * 74)
            print("NOT DECODED: %s" % path)
            print("=" * 74)
            print("  standard QR decoding failed. Reasons tried:")
            for reason in str(exc).split(" | "):
                print("    - %s" % reason)
            print("")
            print("  Falling back to structural analysis.")
            print("")
            report = analyze_mod.analyze(img)
            print(analyze_mod.format_report(report))
            print("")
            continue
        text, payload = describe_result(result, path)
        print(text)
        print("")
        payloads[path] = payload
        if save_dir:
            os.makedirs(save_dir, exist_ok=True)
            base = os.path.splitext(os.path.basename(path))[0]
            with open(os.path.join(save_dir, base + ".payload.bin"), "wb") as fh:
                fh.write(payload)
            with open(os.path.join(save_dir, base + ".codewords.bin"), "wb") as fh:
                fh.write(result["data_codewords"])
    return payloads


def diff_payloads(a, b, label_a, label_b):
    out = []
    out.append("-" * 74)
    out.append("DIFF: %s  vs  %s" % (label_a, label_b))
    out.append("-" * 74)
    out.append("  lengths: %d vs %d (%s)"
               % (len(a), len(b),
                  "same" if len(a) == len(b) else "DIFFERENT by %d" % (len(b) - len(a))))
    common = min(len(a), len(b))
    diffs = [i for i in range(common) if a[i] != b[i]]
    out.append("  differing bytes in the common prefix: %d of %d (%.1f%%)"
               % (len(diffs), common, 100.0 * len(diffs) / common if common else 0))
    if diffs:
        out.append("  first differing offset: 0x%04x (%d)" % (diffs[0], diffs[0]))
        out.append("  last  differing offset: 0x%04x (%d)" % (diffs[-1], diffs[-1]))
        out.append("  byte-level differences:")
        for i in diffs[:64]:
            out.append("    0x%04x: %02x -> %02x" % (i, a[i], b[i]))
        if len(diffs) > 64:
            out.append("    ... %d more" % (len(diffs) - 64))
        # Contiguous runs of change localise the edit.
        runs = []
        start = diffs[0]
        prev = diffs[0]
        for i in diffs[1:]:
            if i != prev + 1:
                runs.append((start, prev))
                start = i
            prev = i
        runs.append((start, prev))
        out.append("  contiguous changed runs: %d" % len(runs))
        for s, e in runs[:20]:
            out.append("    0x%04x .. 0x%04x  (%d bytes)" % (s, e, e - s + 1))
    return "\n".join(out)


def cmd_compare(paths):
    payloads = cmd_decode(paths)
    ordered = [(p, payloads[p]) for p in paths if p in payloads]
    if len(ordered) < 2:
        print("Need at least two successfully decoded images to compare; got %d."
              % len(ordered))
        return 1
    print("=" * 74)
    print("PAYLOAD COMPARISON")
    print("=" * 74)
    for label, payload in ordered:
        print("  %-40s %d bytes" % (os.path.basename(label), len(payload)))
    print("")
    for i in range(len(ordered)):
        for j in range(i + 1, len(ordered)):
            print(diff_payloads(ordered[i][1], ordered[j][1],
                                os.path.basename(ordered[i][0]),
                                os.path.basename(ordered[j][0])))
            print("")
    return 0


def cmd_analyze(path):
    img = imageio.load_image(path)
    report = analyze_mod.analyze(img)
    print("=" * 74)
    print("STRUCTURAL ANALYSIS: %s" % path)
    print("=" * 74)
    print(analyze_mod.format_report(report))
    if "matrix_ascii" in report:
        print("")
        print("SAMPLED MODULE MATRIX")
        for line in report["matrix_ascii"]:
            print("  " + line)
    return 0


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    cmd = argv[1]
    args = argv[2:]
    if cmd == "decode":
        if not args:
            print("usage: probe.py decode <image> [image ...]")
            return 2
        cmd_decode(args, save_dir="payloads")
        return 0
    if cmd == "analyze":
        if len(args) != 1:
            print("usage: probe.py analyze <image>")
            return 2
        return cmd_analyze(args[0])
    if cmd == "compare":
        if len(args) < 2:
            print("usage: probe.py compare <image> <image> [image ...]")
            return 2
        return cmd_compare(args)
    # Bare image path is treated as decode.
    if os.path.exists(cmd):
        cmd_decode([cmd] + args, save_dir="payloads")
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
