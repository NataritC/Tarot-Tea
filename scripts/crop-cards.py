"""Cut individual card images out of the Noctis Tarot overview poster.

Usage: python3 scripts/crop-cards.py <poster.webp> <out_dir>
The poster is 1536x1024; coordinates below are for that size.
Replace the output with full-resolution exports when available.
"""
import sys, os
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
sx, sy = im.width / 1536, im.height / 1024
os.makedirs(out, exist_ok=True)

def save(name, box):
    l, t, r, b = box
    im.crop((round(l*sx), round(t*sy), round(r*sx), round(b*sy))).save(
        os.path.join(out, name + ".webp"), quality=92)

MAJOR = ["the-fool","the-magician","the-high-priestess","the-empress","the-emperor",
  "the-hierophant","the-lovers","the-chariot","strength","the-hermit","wheel-of-fortune",
  "justice","the-hanged-man","death","temperance","the-devil","the-tower","the-star",
  "the-moon","the-sun","judgement","the-world"]
RANKS = ["ace","two","three","four","five","six","seven","eight","nine","ten",
  "page","knight","queen","king"]
SUITS = [("wands",421,557),("cups",562,696),("swords",701,835),("pentacles",841,982)]

# Major Arcana: two rows of 11
for i, name in enumerate(MAJOR):
    row, col = divmod(i, 11)
    x0 = 376 + col * 104.6
    y0, y1 = (37, 194) if row == 0 else (202, 379)
    save(name, (x0, y0, x0 + 97, y1))

# Minor Arcana: four rows of 14
for suit, y0, y1 in SUITS:
    for col, rank in enumerate(RANKS):
        x0 = 441 + col * 78.3
        save(f"{rank}-of-{suit}", (x0, y0, x0 + 73, y1))

save("card-back", (20, 870, 117, 1004))
print("done")
