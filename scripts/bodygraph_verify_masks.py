"""Render each new leg sub-mask alone over the body image for visual verification."""
from PIL import Image

SOURCE = "public/bodygraph-muscle-map-transparent.png"
for name in ("quads", "hamstrings", "calves"):
    body = Image.open(SOURCE).convert("RGBA")
    mask = Image.open(f"public/bodygraph-masks/{name}.png").convert("RGBA")
    composite = Image.alpha_composite(body, mask)
    out = f"public/bodygraph-masks/_debug-{name}-overlay.png"
    composite.save(out)
    print(f"  wrote {out}")
