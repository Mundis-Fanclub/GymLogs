"""Split legs.png into quads.png / hamstrings.png / calves.png.

Strategy: take the existing legs.png pixels (they are already correct per
CLAUDE_NOTES.md 2026-05-17 fix) and partition them by region:

    quads      = pixels with x <  720 AND y <  740   (front-view, upper)
    hamstrings = pixels with x >= 720 AND y <  740   (back-view, upper)
    calves     = pixels with                y >= 740 (both views, lower)

The Y-cut at 740 sits in a clean gap between the upper-leg components
(end y=728/739) and the calf components (start y=741/748). Component
analysis in bodygraph_analyze_legs.py confirms this.

Also renders a debug overlay so we can verify visually before commit.
"""
import numpy as np
from PIL import Image

MASK_PATH = "public/bodygraph-masks/legs.png"
SOURCE_PATH = "public/bodygraph-muscle-map-transparent.png"
OUT_DIR = "public/bodygraph-masks"

Y_UPPER_LOWER_SPLIT = 740
X_FRONT_BACK_SPLIT = 720
ALPHA = 150
RGB = (239, 68, 68)  # red, alpha layered on top

legs = np.array(Image.open(MASK_PATH))
H, W = legs.shape[:2]
binary = legs[:, :, 3] > 0

# Three partitions
quads_mask = np.zeros((H, W), dtype=bool)
hams_mask = np.zeros((H, W), dtype=bool)
calves_mask = np.zeros((H, W), dtype=bool)

ys, xs = np.where(binary)
for y, x in zip(ys, xs):
    if y >= Y_UPPER_LOWER_SPLIT:
        calves_mask[y, x] = True
    elif x < X_FRONT_BACK_SPLIT:
        quads_mask[y, x] = True
    else:
        hams_mask[y, x] = True

print(f"Splits: quads={quads_mask.sum()} ham={hams_mask.sum()} calves={calves_mask.sum()} (orig={binary.sum()})")
assert quads_mask.sum() + hams_mask.sum() + calves_mask.sum() == binary.sum(), "lost pixels!"

def write_mask(mask: np.ndarray, name: str) -> None:
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[mask, 0] = RGB[0]
    rgba[mask, 1] = RGB[1]
    rgba[mask, 2] = RGB[2]
    rgba[mask, 3] = ALPHA
    Image.fromarray(rgba, "RGBA").save(f"{OUT_DIR}/{name}.png")
    print(f"  wrote {OUT_DIR}/{name}.png")

write_mask(quads_mask, "quads")
write_mask(hams_mask, "hamstrings")
write_mask(calves_mask, "calves")

# Debug overlay so we can see the 3 zones over the body
source = Image.open(SOURCE_PATH).convert("RGBA")
debug = np.array(source).copy()

# Apply each color
def overlay(arr: np.ndarray, mask: np.ndarray, color: tuple, alpha: int) -> np.ndarray:
    src_alpha = arr[..., 3].astype(np.float32) / 255.0
    over_alpha = (mask.astype(np.float32)) * (alpha / 255.0)
    out_alpha = src_alpha + over_alpha * (1 - src_alpha)
    for c in range(3):
        arr[..., c] = (
            arr[..., c].astype(np.float32) * (1 - over_alpha) + color[c] * over_alpha
        ).clip(0, 255).astype(np.uint8)
    arr[..., 3] = (out_alpha * 255).clip(0, 255).astype(np.uint8)
    return arr

debug = overlay(debug, quads_mask, (16, 185, 129), 180)        # emerald-green
debug = overlay(debug, hams_mask, (132, 204, 22), 180)         # lime
debug = overlay(debug, calves_mask, (101, 163, 13), 180)       # olive

Image.fromarray(debug, "RGBA").save(f"{OUT_DIR}/_debug-leg-split.png")
print(f"  wrote {OUT_DIR}/_debug-leg-split.png (3-color overlay)")
