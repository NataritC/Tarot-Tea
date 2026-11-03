"""AI-upscale the Noctis Tarot cards from the overview poster with Real-ESRGAN (x4plus).

Usage:
  pip install ncnn pillow numpy
  # model files: realesrgan-x4plus.param/.bin from
  # https://github.com/xinntao/Real-ESRGAN/releases (realesrgan-ncnn-vulkan zip, models/)
  python3 scripts/upscale-cards.py <poster.webp> <models_dir> <out_dir> [card-id ...]

Each card is cropped from the poster with a small margin, upscaled 4x by the model,
trimmed back to the card, then lightly sharpened and saved as WebP.
"""
import os, sys, time
import numpy as np
import ncnn
from PIL import Image, ImageFilter

src, models, out = sys.argv[1], sys.argv[2], sys.argv[3]
only = set(sys.argv[4:])
os.makedirs(out, exist_ok=True)

poster = Image.open(src).convert("RGB")
sx, sy = poster.width / 1536, poster.height / 1024

MAJOR = ["the-fool","the-magician","the-high-priestess","the-empress","the-emperor",
  "the-hierophant","the-lovers","the-chariot","strength","the-hermit","wheel-of-fortune",
  "justice","the-hanged-man","death","temperance","the-devil","the-tower","the-star",
  "the-moon","the-sun","judgement","the-world"]
RANKS = ["ace","two","three","four","five","six","seven","eight","nine","ten",
  "page","knight","queen","king"]

# Nominal card positions on the 1536x1024 poster; each edge is then snapped to the
# card's bright outer frame line (the poster's spacing is slightly uneven).
LUM = np.asarray(poster.convert("L"), dtype=float)
# Top/bottom outer frame lines shared by every card in a row (measured on the poster).
ROWS = {"major1": (35, 194), "major2": (204, 379), "wands": (418, 554),
        "cups": (568, 693), "swords": (705, 835), "pentacles": (842, 977)}

def edge(nominal, profile, direction, size):
    """Find the card's outer frame line near `nominal`: scanning outward from 10px inside,
    the first bright line (frame) that has the dark gap right outside it."""
    inside = nominal - 10 * direction
    for k in range(0, 22):
        v = inside + k * direction
        o1, o2 = v + direction, v + 2 * direction
        if not (0 <= o2 < size):
            break
        if profile(v) > 50 and profile(o1) < 15 and profile(o2) < 15:
            return v
    return nominal

def refine(x0, y0, x1, y1):
    x0, y0, x1, y1 = (round(v * sx) for v in (x0, y0, x1, y1))
    ym0, ym1 = y0 + (y1 - y0) // 5, y1 - (y1 - y0) // 5
    def col(x): return LUM[ym0:ym1, x].mean()
    W = LUM.shape[1]
    L = edge(x0, col, -1, W); R = edge(x1, col, +1, W)
    return L, y0, R + 1, y1 + 1

boxes = {}
for i, name in enumerate(MAJOR):
    r, c = divmod(i, 11)
    x0 = 377 + c * 105.2
    y0, y1 = ROWS["major1" if r == 0 else "major2"]
    boxes[name] = refine(x0, y0, x0 + 98, y1)
for suit in ("wands", "cups", "swords", "pentacles"):
    y0, y1 = ROWS[suit]
    for c, rank in enumerate(RANKS):
        x0 = 442 + c * 78.15
        boxes[f"{rank}-of-{suit}"] = refine(x0, y0, x0 + 73, y1)

if os.environ.get("DEBUG_BOXES"):
    from PIL import ImageDraw
    dbg = poster.copy(); d = ImageDraw.Draw(dbg)
    for b in boxes.values():
        d.rectangle((b[0], b[1], b[2] - 1, b[3] - 1), outline=(0, 255, 0))
    dbg.save(os.environ["DEBUG_BOXES"])

net = ncnn.Net()
net.opt.num_threads = os.cpu_count() or 4
net.opt.use_vulkan_compute = False
net.load_param(os.path.join(models, "realesrgan-x4plus.param"))
net.load_model(os.path.join(models, "realesrgan-x4plus.bin"))

def esrgan(img):
    arr = np.asarray(img, dtype=np.float32).transpose(2, 0, 1) / 255.0
    ex = net.create_extractor()
    ex.input("data", ncnn.Mat(np.ascontiguousarray(arr)))
    _, res = ex.extract("output")
    o = np.clip(np.array(res).transpose(1, 2, 0) * 255.0, 0, 255).round().astype(np.uint8)
    return Image.fromarray(o)

PAD = 6  # context pixels around the card so edges upscale cleanly
for name, (L, T, R, B) in boxes.items():
    if only and name not in only:
        continue
    t0 = time.time()
    crop = poster.crop((L - PAD, T - PAD, R + PAD, B + PAD))
    up = esrgan(crop)
    up = up.crop((PAD * 4, PAD * 4, up.width - PAD * 4, up.height - PAD * 4))
    up = up.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=3))
    up.save(os.path.join(out, name + ".webp"), quality=90, method=6)
    print(f"{name}: {up.size} in {time.time() - t0:.1f}s", flush=True)
