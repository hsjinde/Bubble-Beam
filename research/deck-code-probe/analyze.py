"""Structural analysis of a 2D code image, for when standard decoding fails.

A failed decode on its own proves nothing -- a JPEG-mangled screenshot fails
too. This module produces the evidence needed to tell the two apart: whether
the three QR finder patterns are present, what the module pitch and matrix
dimensions are, whether timing patterns alternate, and whether the image is
genuinely bilevel or carries extra colours (which would mean data packed into
colour, i.e. not a standard QR at all).

Everything here reports measurements. It does not conclude.
"""

import math
from collections import Counter

import qrspec as S
import qrdecode


def summarize_colors(img, sample_limit=4_000_000):
    """Distinct colours, dominant colours, and how bilevel the image really is."""
    data = img.data
    n = img.width * img.height
    step = max(1, n // sample_limit)
    exact = Counter()
    quantized = Counter()
    sat_total = 0
    sat_count = 0
    sampled = 0
    for i in range(0, n, step):
        r, g, b = data[i * 4], data[i * 4 + 1], data[i * 4 + 2]
        exact[(r, g, b)] += 1
        quantized[(r >> 4, g >> 4, b >> 4)] += 1
        mx, mn = max(r, g, b), min(r, g, b)
        if mx:
            sat_total += (mx - mn) * 255 // mx
            sat_count += 1
        sampled += 1

    top = quantized.most_common(12)
    # How much of the image sits at the two extremes (near-black / near-white)?
    extreme = 0
    for (r, g, b), count in quantized.items():
        lum = (r * 299 + g * 587 + b * 114) // 1000
        if lum <= 2 or lum >= 13:
            extreme += count
    return {
        "pixels_sampled": sampled,
        "distinct_exact_colors": len(exact),
        "distinct_quantized_colors": len(quantized),
        "top_colors": [((r << 4, g << 4, b << 4), c / sampled) for (r, g, b), c in top],
        "mean_saturation_pct": (sat_total / sat_count) if sat_count else 0.0,
        "fraction_near_black_or_white": extreme / sampled,
    }


def transition_profile(binary, width, height):
    """Per-row and per-column counts of colour transitions."""
    rows = [0] * height
    cols = [0] * width
    for y in range(height):
        base = y * width
        prev = binary[base]
        for x in range(1, width):
            v = binary[base + x]
            if v != prev:
                rows[y] += 1
                cols[x] += 1
                prev = v
    return rows, cols


def bounding_box(binary, width, height):
    """Bound the busy (code-bearing) region using transition density."""
    rows, cols = transition_profile(binary, width, height)
    if not any(rows):
        return None
    row_thr = max(rows) * 0.25
    col_thr = max(cols) * 0.25
    ys = [y for y, v in enumerate(rows) if v >= row_thr]
    xs = [x for x, v in enumerate(cols) if v >= col_thr]
    if not ys or not xs:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def run_length_stats(binary, width, height, box=None):
    """Histogram of run lengths -- the mode approximates the module pitch."""
    x0, y0, x1, y1 = box if box else (0, 0, width - 1, height - 1)
    lengths = Counter()
    for y in range(y0, y1 + 1):
        base = y * width
        run = 1
        for x in range(x0 + 1, x1 + 1):
            if binary[base + x] == binary[base + x - 1]:
                run += 1
            else:
                lengths[run] += 1
                run = 1
    for x in range(x0, x1 + 1):
        run = 1
        for y in range(y0 + 1, y1 + 1):
            if binary[y * width + x] == binary[(y - 1) * width + x]:
                run += 1
            else:
                lengths[run] += 1
                run = 1
    if not lengths:
        return None, lengths
    # Ignore 1px runs from antialiasing when a larger pitch clearly dominates.
    ranked = lengths.most_common()
    pitch = ranked[0][0]
    if pitch == 1 and len(ranked) > 1 and ranked[1][1] > ranked[0][1] * 0.4:
        pitch = ranked[1][0]
    return pitch, lengths


def check_timing_patterns(matrix):
    """Timing rows/columns must strictly alternate between the finders."""
    n = len(matrix)
    if n < 21:
        return None
    row = [matrix[6][i] for i in range(8, n - 8)]
    col = [matrix[i][6] for i in range(8, n - 8)]

    def alternation(seq):
        if len(seq) < 2:
            return 0.0
        good = sum(1 for i in range(1, len(seq)) if seq[i] != seq[i - 1])
        return good / (len(seq) - 1)

    return {
        "row6_length": len(row),
        "row6_alternation": alternation(row),
        "col6_length": len(col),
        "col6_alternation": alternation(col),
        "row6_starts_dark": bool(row[0]) if row else None,
        "col6_starts_dark": bool(col[0]) if col else None,
    }


def check_finder_shape(matrix, corner):
    """Verify a 7x7 finder pattern at a corner of the sampled matrix."""
    n = len(matrix)
    r0, c0 = {"tl": (0, 0), "tr": (0, n - 7), "bl": (n - 7, 0)}[corner]
    ok = 0
    for dr in range(7):
        for dc in range(7):
            ring = max(abs(dr - 3), abs(dc - 3))
            expected = ring != 2
            if matrix[r0 + dr][c0 + dc] == expected:
                ok += 1
    return ok / 49.0


def quiet_zone(binary, width, height, box, module_size):
    """Fraction of light pixels in the border just outside the code."""
    x0, y0, x1, y1 = box
    margin = max(1, int(module_size * 2))
    light = 0
    total = 0
    for y in range(max(0, y0 - margin), min(height, y1 + margin + 1)):
        for x in range(max(0, x0 - margin), min(width, x1 + margin + 1)):
            if x0 <= x <= x1 and y0 <= y <= y1:
                continue
            total += 1
            if not binary[y * width + x]:
                light += 1
    return (light / total) if total else None


def analyze(img, verbose=True):
    """Run the full structural analysis and return a report dict."""
    report = {}
    report["image"] = {"width": img.width, "height": img.height}
    report["colors"] = summarize_colors(img)

    gray = img.to_gray()
    binary, thr = qrdecode.binarize_global(gray, img.width, img.height)
    report["otsu_threshold"] = thr
    report["dark_fraction"] = sum(binary) / len(binary)

    box = bounding_box(binary, img.width, img.height)
    report["code_bounding_box"] = box
    if box:
        report["code_box_size"] = (box[2] - box[0] + 1, box[3] - box[1] + 1)

    pitch, lengths = run_length_stats(binary, img.width, img.height, box)
    report["module_pitch_px_estimate"] = pitch
    report["run_length_histogram"] = dict(sorted(lengths.most_common(10)))

    if box and pitch:
        w = box[2] - box[0] + 1
        h = box[3] - box[1] + 1
        report["inferred_matrix"] = (round(w / pitch), round(h / pitch))
        report["quiet_zone_light_fraction"] = quiet_zone(
            binary, img.width, img.height, box, pitch)

    # Finder patterns, across every binarizer we have.
    finder_report = {}
    best = None
    for name, make_binary in (
        ("otsu", lambda: binary),
        ("adaptive-16", lambda: qrdecode.binarize_adaptive(gray, img.width, img.height, 16)),
        ("adaptive-8", lambda: qrdecode.binarize_adaptive(gray, img.width, img.height, 8)),
    ):
        try:
            b = make_binary()
            pats = qrdecode.find_finder_patterns(b, img.width, img.height)
        except Exception as exc:
            finder_report[name] = "error: %s" % exc
            continue
        finder_report[name] = [
            {"x": round(p.x, 1), "y": round(p.y, 1),
             "module_size": round(p.module_size, 2), "hits": p.count}
            for p in pats[:6]
        ]
        if len(pats) >= 3 and best is None:
            best = (name, b, pats)
    report["finder_patterns"] = finder_report

    if best is None:
        report["verdict_inputs"] = {
            "three_finders_found": False,
        }
        return report

    name, b, pats = best
    tl, tr, bl = qrdecode.order_finders(pats)
    module_size = (tl.module_size + tr.module_size + bl.module_size) / 3.0
    dim_top = round(math.hypot(tr.x - tl.x, tr.y - tl.y) / module_size) + 7
    dim_left = round(math.hypot(bl.x - tl.x, bl.y - tl.y) / module_size) + 7
    dim = (dim_top + dim_left) // 2
    report["geometry"] = {
        "binarizer": name,
        "top_left": (round(tl.x, 1), round(tl.y, 1)),
        "top_right": (round(tr.x, 1), round(tr.y, 1)),
        "bottom_left": (round(bl.x, 1), round(bl.y, 1)),
        "module_size_px": round(module_size, 2),
        "dimension_from_top_edge": dim_top,
        "dimension_from_left_edge": dim_left,
        "dimension_estimate": dim,
        "is_valid_qr_dimension": dim % 4 == 1 and 21 <= dim <= 177,
        "implied_version": ((dim - 17) // 4) if (dim % 4 == 1 and 21 <= dim <= 177) else None,
    }

    # Sample the grid and inspect the structure directly.
    for candidate in (dim, dim - 1, dim + 1, dim - 2, dim + 2):
        if not (candidate % 4 == 1 and 21 <= candidate <= 177):
            continue
        try:
            br_x = tr.x - tl.x + bl.x
            br_y = tr.y - tl.y + bl.y
            src = [(3.5, 3.5), (candidate - 3.5, 3.5),
                   (candidate - 3.5, candidate - 3.5), (3.5, candidate - 3.5)]
            dst = [(tl.x, tl.y), (tr.x, tr.y), (br_x, br_y), (bl.x, bl.y)]
            transform = qrdecode.quad_to_quad(src, dst)
            matrix = qrdecode.sample_grid(b, img.width, img.height, transform, candidate)
        except Exception:
            continue
        entry = {
            "dimension": candidate,
            "timing": check_timing_patterns(matrix),
            "finder_shape_match": {
                c: round(check_finder_shape(matrix, c), 3) for c in ("tl", "tr", "bl")
            },
            "dark_module_ratio": round(
                sum(sum(1 for v in row if v) for row in matrix) / (candidate ** 2), 3),
        }
        try:
            ecl, mask, copy_used, errs = qrdecode.read_format_info(matrix)
            entry["format_info"] = {
                "ec_level": ecl, "mask": mask, "copy": copy_used, "bit_errors": errs}
        except Exception as exc:
            entry["format_info"] = "unreadable: %s" % exc
        report.setdefault("sampled_grids", []).append(entry)
        report["matrix_ascii"] = [
            "".join("#" if v else "." for v in row) for row in matrix]
        break

    return report


def format_report(report):
    """Render the report as readable text."""
    out = []
    img = report["image"]
    out.append("IMAGE")
    out.append("  dimensions            : %d x %d px" % (img["width"], img["height"]))

    c = report["colors"]
    out.append("")
    out.append("COLOUR")
    out.append("  distinct colours      : %d exact, %d quantized (4 bits/channel)"
               % (c["distinct_exact_colors"], c["distinct_quantized_colors"]))
    out.append("  mean saturation       : %.1f%%  (0%% = pure greyscale)"
               % c["mean_saturation_pct"])
    out.append("  near-black/near-white : %.1f%% of pixels"
               % (c["fraction_near_black_or_white"] * 100))
    out.append("  dominant colours      :")
    for (rgb, frac) in c["top_colors"][:6]:
        out.append("      #%02X%02X%02X  %.2f%%" % (rgb[0], rgb[1], rgb[2], frac * 100))

    out.append("")
    out.append("GEOMETRY")
    out.append("  otsu threshold        : %d" % report["otsu_threshold"])
    out.append("  dark pixel fraction   : %.3f" % report["dark_fraction"])
    out.append("  code bounding box     : %s" % (report.get("code_bounding_box"),))
    if "code_box_size" in report:
        out.append("  code box size         : %d x %d px" % report["code_box_size"])
    out.append("  module pitch estimate : %s px" % report.get("module_pitch_px_estimate"))
    if "inferred_matrix" in report:
        mw, mh = report["inferred_matrix"]
        out.append("  inferred matrix       : %d x %d modules" % (mw, mh))
        valid = [d for d in (mw, mh) if d % 4 == 1 and 21 <= d <= 177]
        out.append("  QR-legal dimension?   : %s  (QR must be square and 21+4n)"
                   % ("yes, both axes" if len(valid) == 2 else
                      "no -- %dx%d is not 21+4n" % (mw, mh)))
    if "quiet_zone_light_fraction" in report:
        qz = report["quiet_zone_light_fraction"]
        out.append("  quiet zone light      : %s"
                   % ("%.3f" % qz if qz is not None else "n/a"))
    out.append("  run length histogram  : %s" % report.get("run_length_histogram"))

    out.append("")
    out.append("FINDER PATTERNS (QR requires three, at three corners)")
    for name, pats in report["finder_patterns"].items():
        if isinstance(pats, str):
            out.append("  %-12s %s" % (name, pats))
        else:
            out.append("  %-12s %d candidate(s)" % (name, len(pats)))
            for p in pats:
                out.append("      x=%-7.1f y=%-7.1f module=%-5.2f hits=%d"
                           % (p["x"], p["y"], p["module_size"], p["hits"]))

    if "geometry" in report:
        g = report["geometry"]
        out.append("")
        out.append("QR GRID FIT")
        out.append("  module size           : %.2f px" % g["module_size_px"])
        out.append("  dimension (top/left)  : %d / %d modules"
                   % (g["dimension_from_top_edge"], g["dimension_from_left_edge"]))
        out.append("  dimension estimate    : %d modules" % g["dimension_estimate"])
        out.append("  valid QR dimension    : %s  (must be 21+4n, n=0..39)"
                   % g["is_valid_qr_dimension"])
        out.append("  implied version       : %s" % g["implied_version"])

    for entry in report.get("sampled_grids", []):
        out.append("")
        out.append("SAMPLED GRID (%d x %d)" % (entry["dimension"], entry["dimension"]))
        t = entry["timing"]
        if t:
            out.append("  timing row 6          : %d modules, %.1f%% alternating"
                       % (t["row6_length"], t["row6_alternation"] * 100))
            out.append("  timing col 6          : %d modules, %.1f%% alternating"
                       % (t["col6_length"], t["col6_alternation"] * 100))
        fs = entry["finder_shape_match"]
        out.append("  finder shape match    : tl=%.0f%% tr=%.0f%% bl=%.0f%%"
                   % (fs["tl"] * 100, fs["tr"] * 100, fs["bl"] * 100))
        out.append("  dark module ratio     : %.3f  (QR targets ~0.5)"
                   % entry["dark_module_ratio"])
        out.append("  format information    : %s" % (entry["format_info"],))

    return "\n".join(out)
