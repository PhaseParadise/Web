#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════════════
 PhaseParadise, icon build

 Source: assets/images/logo/icon.png, the mark on a transparent ground.
 It is 604 × 544 and its glyph touches all four edges, neither of which
 works as a favicon:

   · Google only accepts a square icon and drops anything else, which is
     why search results showed the default globe instead of the mark.
   · Favicons get masked into a circle, so a glyph that reaches the edge
     loses its corners.
   · The middle of the mark is transparent, not white. On a dark surface
     the interior goes dark and the mark stops reading as an app tile.

 So every icon here is square, sits on the site's own background colour,
 and keeps a margin wide enough to survive a circular mask.

 Icons change about once a year, so this is not wired into CI. It needs
 Pillow, which the site itself does not:

     python3 -m venv .venv && .venv/bin/pip install Pillow
     .venv/bin/python tools/build-icons.py
══════════════════════════════════════════════════════════════════════
"""
from pathlib import Path
from PIL import Image

SOURCE = "assets/images/logo/icon.png"
GROUND = (248, 249, 250, 255)   # --bg / <meta name="theme-color">
COVERAGE = 0.78                 # share of the tile the glyph may fill
MASTER = 1024                   # rendered once this big, then scaled down

root = Path(__file__).resolve().parent.parent
src = Image.open(root / SOURCE).convert("RGBA")

# Crop to what is actually drawn, so the margin below is measured from the
# mark and not from whatever empty space the export happened to leave.
glyph = src.crop(src.getbbox())

box = int(MASTER * COVERAGE)
scale = min(box / glyph.width, box / glyph.height)
glyph = glyph.resize(
    (round(glyph.width * scale), round(glyph.height * scale)),
    Image.LANCZOS,
)

master = Image.new("RGBA", (MASTER, MASTER), GROUND)
master.alpha_composite(
    glyph,
    ((MASTER - glyph.width) // 2, (MASTER - glyph.height) // 2),
)

def write(target, size, fmt=None, **kw):
    out = root / target
    out.parent.mkdir(parents=True, exist_ok=True)
    img = master.resize((size, size), Image.LANCZOS)
    if fmt == "ICO":
        img.save(out, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    else:
        img.convert("RGB").save(out, **kw)
    print(f"  {target:<44} {size:>4} px  {out.stat().st_size / 1024:5.1f} KB")

# Declared in the pages. 192 is a multiple of 48, which is what Google asks
# for, and covers high density screens at the same time.
write("assets/images/logo/favicon-192.png", 192, optimize=True)

# iOS composites this one onto black if it carries transparency, and rounds
# the corners itself, so it ships opaque and square.
write("assets/images/logo/apple-touch-icon.png", 180, optimize=True)

# Nothing links to this, browsers and crawlers ask for it by convention.
# It has to sit at the root to be found.
write("favicon.ico", 48, fmt="ICO")
