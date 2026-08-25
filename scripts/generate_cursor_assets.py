import random
import math
from PIL import Image, ImageDraw

OUT_DIR = "public/assets"


def new_image(size):
    return Image.new("RGBA", (size, size), (0, 0, 0, 0))


def draw_spray_can(draw_ctx, body_color, cap_depressed=False):
    """Draw a vertical aerosol can centered in a square context."""
    # Body
    body_w, body_h = 28, 70
    x0, y0 = 18, 25
    draw_ctx.rounded_rectangle(
        [x0, y0, x0 + body_w, y0 + body_h], radius=6, fill=body_color, outline="#111111", width=2
    )
    # Magenta paint drip
    draw_ctx.ellipse([x0 + 4, y0 + 10, x0 + 14, y0 + 30], fill="#FF0055")
    draw_ctx.ellipse([x0 + 8, y0 + 26, x0 + 16, y0 + 42], fill="#FF0055")
    # Silver dome cap
    cap_box = [x0 - 2, y0 - 12, x0 + body_w + 2, y0 + 8]
    draw_ctx.pieslice(cap_box, 0, 180, fill="#E8E8E8", outline="#111111", width=2)
    # Nozzle
    nozzle_w, nozzle_h = 10, 8
    nx = x0 + (body_w - nozzle_w) // 2
    ny = y0 - 16
    draw_ctx.rounded_rectangle(
        [nx, ny, nx + nozzle_w, ny + nozzle_h], radius=2, fill="#111111", outline="#555555", width=1
    )
    # Tip
    tip_x = nx + nozzle_w // 2
    tip_y = ny - 2
    draw_ctx.ellipse([tip_x - 2, tip_y - 2, tip_x + 2, tip_y + 2], fill="#555555")

    if cap_depressed:
        # Spray cone particles
        for i in range(12):
            angle = math.radians(-45 + random.uniform(-12, 12))
            dist = random.uniform(10, 36)
            px = tip_x + math.cos(angle) * dist
            py = tip_y + math.sin(angle) * dist
            r = random.uniform(1.5, 4)
            alpha = int(255 * (1 - dist / 40))
            green = (57, 255, 20, alpha)
            draw_ctx.ellipse([px - r, py - r, px + r, py + r], fill=green)

    return tip_x, tip_y


def make_cursor(depressed=False):
    size = 128
    img = new_image(size)
    draw_ctx = ImageDraw.Draw(img)
    tip_x, tip_y = draw_spray_can(draw_ctx, "#39FF14", cap_depressed=depressed)

    # Rotate so nozzle points to upper-right
    rotated = img.rotate(-45, resample=Image.BICUBIC, expand=False, center=(size // 2, size // 2))

    # Find bounding box and center-crop to 64x64, keeping nozzle tip near top-right
    bbox = rotated.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        w, h = right - left, bottom - top
        target = 64
        # center crop to target, but bias a bit to keep nozzle in frame
        cx, cy = (left + right) // 2, (top + bottom) // 2
        # bias toward top-right because nozzle is there
        cx += 4
        cy -= 4
        left = max(0, cx - target // 2)
        top = max(0, cy - target // 2)
        if left + target > size:
            left = size - target
        if top + target > size:
            top = size - target
        cursor = rotated.crop((left, top, left + target, top + target))
    else:
        cursor = rotated

    # Mark hotspot by returning approximate tip location in 64x64 coords
    # We know the nozzle is at the top-right of the cropped area visually.
    return cursor


def make_splatter(color, seed=0):
    random.seed(seed)
    size = 128
    img = new_image(size)
    draw_ctx = ImageDraw.Draw(img)
    # Main blob
    cx, cy = size // 2, size // 2
    for _ in range(8):
        rx = random.randint(12, 35)
        ry = random.randint(10, 28)
        ox = random.randint(-20, 20)
        oy = random.randint(-20, 20)
        draw_ctx.ellipse([cx - rx + ox, cy - ry + oy, cx + rx + ox, cy + ry + oy], fill=color)
    # Droplets
    for _ in range(12):
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(25, 55)
        px = cx + math.cos(angle) * dist
        py = cy + math.sin(angle) * dist
        r = random.uniform(2, 6)
        draw_ctx.ellipse([px - r, py - r, px + r, py + r], fill=color)
    return img.resize((64, 64), Image.LANCZOS)


def main():
    import os
    os.makedirs(OUT_DIR, exist_ok=True)

    idle = make_cursor(depressed=False)
    idle.save(f"{OUT_DIR}/cursor_idle.png")

    spray = make_cursor(depressed=True)
    spray.save(f"{OUT_DIR}/cursor_spray.png")

    make_splatter("#39FF14", seed=1).save(f"{OUT_DIR}/splatter_green.png")
    make_splatter("#FF0055", seed=2).save(f"{OUT_DIR}/splatter_magenta.png")
    make_splatter("#FFE600", seed=3).save(f"{OUT_DIR}/splatter_yellow.png")

    print(f"Assets saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
