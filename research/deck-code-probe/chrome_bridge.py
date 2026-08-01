"""Headless Chromium bridge for image decoding and degradation.

No image library can be installed in this container, so anything that is not a
PNG (a JPEG screenshot, most likely) is handed to Chromium, drawn onto a canvas
and read back as a lossless PNG. The same bridge applies the degradations a
screenshot picks up on its way through a chat app -- rescaling, JPEG
recompression, rotation, blur -- which is how the decoder gets tested against
realistic input rather than only against pristine renders.
"""

import base64
import os
import re
import shutil
import subprocess
import tempfile

CHROME_CANDIDATES = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
]


def find_chrome():
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    for name in ("chromium", "chromium-browser", "google-chrome"):
        found = shutil.which(name)
        if found:
            return found
    raise RuntimeError("no Chromium binary found")


_PAGE = """<!doctype html>
<html><body><div id="out">PENDING</div><script>
const img = new Image();
img.onload = () => {
  try {
    const sw = img.naturalWidth, sh = img.naturalHeight;
    const scale = %(scale)s, angle = %(angle)s, blur = %(blur)s;
    const rad = angle * Math.PI / 180;
    const cw = Math.round((Math.abs(Math.cos(rad)) * sw + Math.abs(Math.sin(rad)) * sh) * scale);
    const ch = Math.round((Math.abs(Math.sin(rad)) * sw + Math.abs(Math.cos(rad)) * sh) * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    if (blur > 0) ctx.filter = 'blur(' + blur + 'px)';
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(rad);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -sw / 2, -sh / 2);
    document.getElementById('out').textContent = canvas.toDataURL(%(format)s, %(quality)s);
  } catch (e) {
    document.getElementById('out').textContent = 'ERROR ' + e;
  }
};
img.onerror = (e) => { document.getElementById('out').textContent = 'ERROR load failed'; };
img.src = %(src)s;
</script></body></html>
"""


def _run_page(html, timeout=90):
    chrome = find_chrome()
    tmpdir = tempfile.mkdtemp(prefix="qrbridge-")
    try:
        page = os.path.join(tmpdir, "page.html")
        with open(page, "w") as fh:
            fh.write(html)
        cmd = [
            chrome, "--headless", "--no-sandbox", "--disable-gpu",
            "--disable-dev-shm-usage", "--hide-scrollbars",
            "--allow-file-access-from-files",
            "--virtual-time-budget=20000",
            "--user-data-dir=" + os.path.join(tmpdir, "profile"),
            "--dump-dom", "file://" + page,
        ]
        proc = subprocess.run(cmd, capture_output=True, timeout=timeout)
        dom = proc.stdout.decode("utf-8", "replace")
        match = re.search(r'<div id="out">(.*?)</div>', dom, re.S)
        if not match:
            raise RuntimeError(
                "Chromium produced no output div (stderr: %s)"
                % proc.stderr.decode("utf-8", "replace")[:400])
        payload = match.group(1).strip()
        if payload.startswith("ERROR") or payload == "PENDING":
            raise RuntimeError("Chromium render failed: %s" % payload[:200])
        return payload
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def _data_url(path):
    ext = os.path.splitext(path)[1].lower()
    mime = {
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".gif": "image/gif", ".bmp": "image/bmp",
        ".avif": "image/avif",
    }.get(ext, "application/octet-stream")
    with open(path, "rb") as fh:
        blob = fh.read()
    return "data:%s;base64,%s" % (mime, base64.b64encode(blob).decode())


def render(path, scale=1.0, angle=0.0, blur=0.0, fmt="image/png", quality=0.92):
    """Return PNG/JPEG bytes of the image after the requested transforms."""
    import json
    html = _PAGE % {
        "src": json.dumps(_data_url(path)),
        "scale": repr(float(scale)),
        "angle": repr(float(angle)),
        "blur": repr(float(blur)),
        "format": json.dumps(fmt),
        "quality": repr(float(quality)),
    }
    data_url = _run_page(html)
    if "," not in data_url:
        raise RuntimeError("unexpected canvas output: %s" % data_url[:120])
    return base64.b64decode(data_url.split(",", 1)[1])


def convert_to_png(path):
    """Decode any Chromium-supported image format to PNG bytes."""
    return render(path, fmt="image/png")
