"""Cut the founders out of their photos (ISNet / DIS segmentation via onnxruntime) and place them on the
Ergon Labs night background.
Usage: python portraits.py <src_dir> <out_dir> <model.onnx>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import onnxruntime as ort

src, out = Path(sys.argv[1]), Path(sys.argv[2])
model = sys.argv[3]
out.mkdir(parents=True, exist_ok=True)
S = 800


def background(size: int) -> Image.Image:
    y, x = np.mgrid[0:size, 0:size].astype(np.float32) / size
    base = np.zeros((size, size, 3), np.float32)
    base[:] = (14, 17, 23)
    # amber glow behind the head
    d = np.sqrt((x - 0.5) ** 2 + ((y - 0.36) * 1.1) ** 2)
    a = np.clip(1 - d / 0.55, 0, 1) ** 2.2
    base += a[..., None] * np.array([150, 92, 18], np.float32)
    # violet wash from the lower right
    d2 = np.sqrt((x - 1.0) ** 2 + (y - 1.0) ** 2)
    b = np.clip(1 - d2 / 0.8, 0, 1) ** 2
    base += b[..., None] * np.array([40, 34, 90], np.float32)
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    # dot grid
    dots = Image.new("L", (size, size), 0)
    dd = ImageDraw.Draw(dots)
    step = 26
    for gy in range(step // 2, size, step):
        for gx in range(step // 2, size, step):
            dd.ellipse((gx - 1, gy - 1, gx + 1, gy + 1), fill=38)
    img.paste(Image.new("RGB", (size, size), (255, 255, 255)), (0, 0), dots)
    # thin ring behind the head
    ring = Image.new("L", (size, size), 0)
    ImageDraw.Draw(ring).ellipse((size * 0.17, size * 0.03, size * 0.83, size * 0.69), outline=70, width=2)
    img.paste(Image.new("RGB", (size, size), (245, 165, 36)), (0, 0), ring)
    return img


sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
inp = sess.get_inputs()[0].name


def mask_of(im: Image.Image) -> Image.Image:
    x = np.asarray(im.resize((1024, 1024), Image.LANCZOS), np.float32)
    x = x / max(x.max(), 1e-6) - 0.5
    x = x.transpose(2, 0, 1)[None]
    pred = sess.run(None, {inp: x})[0][:, 0]
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    return Image.fromarray((pred[0] * 255).astype(np.uint8)).resize(im.size, Image.LANCZOS)


bg = background(S)
for p in sorted(src.glob("*.webp")):
    im = Image.open(p).convert("RGB").resize((S, S), Image.LANCZOS)
    am = np.asarray(mask_of(im), np.float32) / 255
    am = np.clip((am - 0.08) / 0.92, 0, 1) ** 1.35  # tighten the edge so old background does not bleed in
    alpha = Image.fromarray((am * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    # unify the grade: slightly less saturated, a touch of contrast
    person = ImageEnhance.Color(im).enhance(0.9)
    person = ImageEnhance.Contrast(person).enhance(1.04)
    # defringe: darken and desaturate semi-transparent edge pixels (hair against the old background)
    pa = np.asarray(person, np.float32)
    k = np.clip(am / 0.85, 0, 1)[..., None]
    grey = pa.mean(axis=2, keepdims=True)
    pa = (pa * k + grey * (1 - k)) * (0.45 + 0.55 * k)
    person = Image.fromarray(np.clip(pa, 0, 255).astype(np.uint8))
    comp = bg.copy()
    comp.paste(person, (0, 0), alpha)
    # warm rim light from the glow, only on the subject's edges
    edge = alpha.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(3))
    edge = Image.fromarray((np.asarray(edge, np.float32) * 0.22).astype(np.uint8))
    comp.paste(Image.new("RGB", (S, S), (255, 190, 90)), (0, 0), edge)
    # fade the bottom into the page colour
    y = np.linspace(0, 1, S, dtype=np.float32)
    fade = np.clip((y - 0.78) / 0.22, 0, 1) ** 1.5 * 200
    fmask = Image.fromarray(np.repeat(fade[:, None], S, 1).astype(np.uint8))
    comp.paste(Image.new("RGB", (S, S), (10, 12, 17)), (0, 0), fmask)
    comp.save(out / p.name, "WEBP", quality=86, method=6)
    alpha.save(out / f"{p.stem}-mask.png")
    print("wrote", out / p.name)
