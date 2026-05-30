"""Analyse the existing legs.png mask: list connected components + Y/X ranges.

Per CLAUDE_NOTES.md: identify which pixels belong to quads (front upper leg),
hamstrings (back upper leg) and calves (lower legs) so the split is data-driven,
not guessed.
"""
import numpy as np
from PIL import Image
from scipy.ndimage import label

MASK_PATH = "public/bodygraph-masks/legs.png"
SOURCE_PATH = "public/bodygraph-muscle-map-transparent.png"

mask = np.array(Image.open(MASK_PATH))
print(f"legs.png shape: {mask.shape}, alpha unique: {sorted(set(mask[:,:,3].flatten().tolist()))[:5]}...{sorted(set(mask[:,:,3].flatten().tolist()))[-3:]}")

alpha = mask[:, :, 3]
binary = alpha > 0
labels, n = label(binary)
print(f"\nlegs.png has {n} connected components:")
for i in range(1, n + 1):
    ys, xs = np.where(labels == i)
    print(
        f"  L{i}: pixels={len(ys)}  y={ys.min()}-{ys.max()}  x={xs.min()}-{xs.max()}"
    )

print(f"\nOverall bounding box of mask: y={np.where(binary)[0].min()}-{np.where(binary)[0].max()}, x={np.where(binary)[1].min()}-{np.where(binary)[1].max()}")
print(f"Total active pixels: {binary.sum()}")
print(f"Body center back-view (from notes): x=1054")
print(f"Front-view: x<720, Back-view: x>=720")

# Split count by front/back
front_pixels = binary[:, :720].sum()
back_pixels = binary[:, 720:].sum()
print(f"\nFront-view pixels (x<720): {front_pixels}")
print(f"Back-view pixels (x>=720): {back_pixels}")

# Y-distribution per side
print("\nFront-view Y distribution (50-px buckets):")
for y_start in range(380, 1000, 50):
    count = binary[y_start:y_start+50, :720].sum()
    if count > 0:
        print(f"  y={y_start}-{y_start+50}: {count}")
print("\nBack-view Y distribution (50-px buckets):")
for y_start in range(380, 1000, 50):
    count = binary[y_start:y_start+50, 720:].sum()
    if count > 0:
        print(f"  y={y_start}-{y_start+50}: {count}")
