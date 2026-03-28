from PIL import Image
import numpy as np
import os
import shutil

def extract_clothing_png(
    cloth_path: str,
    mask_path: str,
    output_path: str,
    padding: int = 10
):
    """
    Extract clothing from image using mask
    → Returns transparent PNG with only clothing

    cloth_path  → path to clothing image (JPG)
    mask_path   → path to clothing mask  (JPG)
    output_path → where to save PNG
    padding     → extra padding around clothing
    """

    # ── Load images ───────────────────────────────
    cloth = Image.open(cloth_path).convert("RGBA")
    mask  = Image.open(mask_path).convert("L")     # Grayscale

    # ── Resize mask to match cloth if needed ──────
    if mask.size != cloth.size:
        mask = mask.resize(cloth.size, Image.LANCZOS)

    # ── Convert mask to numpy ─────────────────────
    mask_arr  = np.array(mask)
    cloth_arr = np.array(cloth)

    # ── Threshold mask ────────────────────────────
    # VITON-HD mask: white = clothing, black = background
    binary_mask = (mask_arr > 127).astype(np.uint8) * 255

    # ── Apply mask as alpha channel ───────────────
    cloth_arr[:, :, 3] = binary_mask

    # ── Crop to clothing bounding box ─────────────
    rows = np.any(binary_mask > 0, axis=1)
    cols = np.any(binary_mask > 0, axis=0)

    if not rows.any() or not cols.any():
        print(f"⚠️  Empty mask: {mask_path}")
        return False

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    # Add padding
    h, w = cloth_arr.shape[:2]
    rmin = max(0, rmin - padding)
    rmax = min(h, rmax + padding)
    cmin = max(0, cmin - padding)
    cmax = min(w, cmax + padding)

    # ── Crop ──────────────────────────────────────
    cropped = cloth_arr[rmin:rmax, cmin:cmax]

    # ── Save as PNG ───────────────────────────────
    result = Image.fromarray(cropped, 'RGBA')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    result.save(output_path, 'PNG', optimize=True)

    print(f"✅ Saved: {output_path} ({result.size[0]}x{result.size[1]})")
    return True


def batch_extract(
    cloth_dir: str,
    mask_dir: str,
    output_dir: str,
    limit: int = 50
):
    """
    Extract clothing PNGs from entire directory
    """
    os.makedirs(output_dir, exist_ok=True)

    cloth_files = sorted([
        f for f in os.listdir(cloth_dir)
        if f.endswith(('.jpg', '.png', '.jpeg'))
    ])[:limit]

    success = 0
    failed  = 0

    print(f"🔄 Processing {len(cloth_files)} images...")

    for i, fname in enumerate(cloth_files):
        # Build paths
        name       = os.path.splitext(fname)[0]
        cloth_path = os.path.join(cloth_dir, fname)

        # Try different mask filename patterns
        mask_fname = None
        for ext in ['.jpg', '.png', '.jpeg']:
            candidate = os.path.join(mask_dir, name + ext)
            if os.path.exists(candidate):
                mask_fname = candidate
                break

        if not mask_fname:
            print(f"⚠️  No mask found for: {fname}")
            failed += 1
            continue

        output_path = os.path.join(output_dir, f"{name}.png")

        # Skip if already processed
        if os.path.exists(output_path):
            success += 1
            continue

        result = extract_clothing_png(
            cloth_path, mask_fname, output_path
        )

        if result:
            success += 1
        else:
            failed += 1

        # Progress
        if (i + 1) % 10 == 0:
            print(f"   Progress: {i+1}/{len(cloth_files)}")

    print(f"\n✅ Done!")
    print(f"   Success: {success}")
    print(f"   Failed:  {failed}")
    print(f"   Saved to: {output_dir}")

    return success


def preview_extraction(cloth_path: str, mask_path: str):
    """
    Quick test — extract one image and show result
    """
    output = "./test_extraction.png"
    result = extract_clothing_png(cloth_path, mask_path, output)
    if result:
        img = Image.open(output)
        img.show()
        print(f"✅ Preview saved: {output}")
    return result


if __name__ == "__main__":
    import os
    BASE_DIR   = os.getcwd()
    cloth_dir  = os.path.join(BASE_DIR, "viton_sample", "cloth")
    mask_dir   = os.path.join(BASE_DIR, "viton_sample", "cloth-mask")
    output_dir = os.path.join(BASE_DIR, "extracted_clothing")

    print(f"📁 Cloth:  {cloth_dir}")
    print(f"📁 Mask:   {mask_dir}")
    print(f"📁 Output: {output_dir}")

    batch_extract(
        cloth_dir  = cloth_dir,
        mask_dir   = mask_dir,
        output_dir = output_dir,
        limit      = 200    # ← increased
    )