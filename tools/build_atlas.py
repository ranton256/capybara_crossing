#!/usr/bin/env python3
"""Build 16x16 / 32x16 frames and a 128x128 atlas from Gemini concept crops."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from game_art_tools.sprites.post import load_palette_colors, nearest_resize, quantize_rgba

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/sprites/raw"
CROPS = RAW / "crops"
TILES = RAW / "tiles_cells"
FRAMES = ROOT / "assets/sprites/frames"
OUT_SHEET = ROOT / "assets/sprites/capybara_crossing.png"
OUT_PREVIEW = ROOT / "assets/sprites/capybara_crossing_preview.png"
OUT_MANIFEST = ROOT / "assets/sprites/manifest.json"
PALETTE = ROOT / "assets/sprites/palette.json"

CELL = 16
SHEET = 128
COLS = SHEET // CELL


def chroma(im: Image.Image) -> Image.Image:
    """Magenta key plus leftover caption white -> transparent."""
    rgba = np.asarray(im.convert("RGBA"), dtype=np.int16)
    r, g, b, a = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
    mag = (r > 150) & (b > 150) & (g < 120) & (r - g > 40) & (b - g > 40)
    white = (r > 210) & (g > 210) & (b > 210)
    # near-black grid lines from leftover sheets
    black_line = (r < 18) & (g < 18) & (b < 18) & (a > 0)
    alpha = np.where(mag | white | black_line, 0, a)
    out = rgba.copy()
    out[..., 3] = alpha
    out[alpha == 0] = 0
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def trim(im: Image.Image, pad: int = 0) -> Image.Image:
    bbox = im.getchannel("A").getbbox()
    if bbox is None:
        return im
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(im.width, right + pad)
    bottom = min(im.height, bottom + pad)
    return im.crop((left, top, right, bottom))


def box_resize(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Area-average downsample, then snap to integer pixels."""
    return im.resize(size, Image.Resampling.BOX)


def fit(im: Image.Image, size: tuple[int, int], *, fill: bool = False) -> Image.Image:
    """Downscale into a canvas. Characters sit on the feet line."""
    w, h = size
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    src = chroma(im.convert("RGBA"))
    if fill:
        src = trim(src) if src.getchannel("A").getbbox() else src
        if src.size != size:
            src = box_resize(src, size)
        # tiles are opaque
        bg = Image.new("RGBA", size, (118, 72, 48, 255))
        if src.mode != "RGBA":
            src = src.convert("RGBA")
        bg.paste(src, (0, 0), src)
        return bg
    src = trim(src)
    if src.getchannel("A").getbbox() is None:
        return canvas
    sw, sh = src.size
    scale = min(w / sw, h / sh)
    nw = max(1, round(sw * scale))
    nh = max(1, round(sh * scale))
    scaled = box_resize(src, (nw, nh))
    x = (w - nw) // 2
    y = h - nh
    canvas.paste(scaled, (x, y), scaled)
    return canvas


def greener_truck(im: Image.Image) -> Image.Image:
    """Push body pixels toward jungle green so the 32x16 truck matches the spec."""
    a = np.asarray(im, dtype=np.int16).copy()
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    lum = r + g + b
    body = (al > 32) & (lum > 140) & (np.abs(r - g) < 45) & (b < g + 30)
    a[..., 0] = np.where(body, np.clip(r - 28, 0, 255), r)
    a[..., 1] = np.where(body, np.clip(g + 22, 0, 255), g)
    a[..., 2] = np.where(body, np.clip(b - 22, 0, 255), b)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def paint_path_dashes(im: Image.Image) -> Image.Image:
    a = np.asarray(im, dtype=np.uint8).copy()
    yellow = (212, 180, 64, 255)
    for x0 in (2, 7, 12):
        a[7, x0 : x0 + 2] = yellow
        a[8, x0 : x0 + 2] = yellow
    return Image.fromarray(a, "RGBA")


def paint_median_flowers(im: Image.Image) -> Image.Image:
    a = np.asarray(im, dtype=np.uint8).copy()
    pink, white, rock = (232, 140, 168, 255), (240, 236, 220, 255), (128, 128, 124, 255)
    a[4, 3] = pink
    a[5, 3] = pink
    a[4, 4] = white
    a[10, 11] = pink
    a[10, 12] = white
    a[8, 9] = rock
    a[9, 9] = rock
    a[8, 10] = (88, 88, 86, 255)
    gray = (a[:, :, 0] == 128) & (a[:, :, 1] == 128) & (a[:, :, 2] == 124)
    gray[8, 9] = gray[9, 9] = False
    a[gray] = (142, 196, 64, 255)
    return Image.fromarray(a, "RGBA")


def paint_spa_details(im: Image.Image) -> Image.Image:
    a = np.asarray(im, dtype=np.uint8).copy()
    stone, steam, reed = (128, 128, 124, 255), (220, 220, 216, 255), (86, 140, 52, 255)
    for x, y in ((1, 2), (2, 1), (13, 2), (14, 1), (1, 13), (2, 14), (13, 14), (14, 13), (7, 1), (8, 14)):
        a[y, x] = stone
    a[6, 7] = steam
    a[5, 8] = steam
    a[2, 4] = reed
    a[3, 12] = reed
    a[12, 3] = reed
    return Image.fromarray(a, "RGBA")


def waddle(frame: Image.Image) -> Image.Image:
    """Idle-up frame 2: vertical squash and shifted leg pixels."""
    arr = np.asarray(frame, dtype=np.uint8)
    body = nearest_resize(frame, (frame.width, max(1, frame.height - 2)))
    out = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    out.paste(body, (0, 2), body)
    a = np.asarray(out, dtype=np.uint8).copy()
    # shift the lowest opaque band one pixel to imply a step
    a[12:16, 0:15] = a[12:16, 1:16]
    a[12:16, 15] = 0
    return Image.fromarray(a, "RGBA")


def ensure_zzz(frame: Image.Image) -> Image.Image:
    """Guarantee a tiny Zzz cluster survives 16x16 downscale."""
    a = np.asarray(frame, dtype=np.uint8).copy()
    top = a[:5, :, 3]
    if int(top.sum()) > 80:
        return frame
    ink = (28, 16, 18, 255)
    # two tiny Z marks
    for x, y in ((9, 0), (10, 1), (11, 0), (12, 1), (13, 2), (14, 1)):
        if 0 <= x < 16 and 0 <= y < 16:
            a[y, x] = ink
    return Image.fromarray(a, "RGBA")


def load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def main() -> int:
    palette = load_palette_colors(PALETTE)
    FRAMES.mkdir(parents=True, exist_ok=True)

    sources = {
        "capy_up_1": (CROPS / "idle_up_a.png", (16, 16), False),
        "capy_down_1": (CROPS / "quad_down_a.png", (16, 16), False),
        "capy_down_2": (CROPS / "quad_down_b.png", (16, 16), False),
        "capy_left_1": (CROPS / "quad_left_a.png", (16, 16), False),
        "capy_left_2": (CROPS / "quad_left_b.png", (16, 16), False),
        "capy_defeat": (CROPS / "quad_defeat.png", (16, 16), False),
        "tile_start": (TILES / "start.png", (16, 16), True),
        "tile_path": (TILES / "path.png", (16, 16), True),
        "tile_median": (TILES / "median.png", (16, 16), True),
        "tile_spa": (CROPS / "spa.png", (16, 16), True),
        "atv_red": (RAW / "atv_red_a.png", (16, 16), False),
        "atv_blue": (RAW / "atv_blue_a.png", (16, 16), False),
        "truck": (RAW / "truck_a.png", (32, 16), False),
        "log": (CROPS / "log.png", (32, 16), False),
        "monkey": (CROPS / "monkey.png", (16, 16), False),
        "parrot": (CROPS / "parrot.png", (16, 16), False),
    }

    frames: dict[str, Image.Image] = {}
    for name, (path, size, fill) in sources.items():
        if not path.is_file():
            raise FileNotFoundError(path)
        src = load(path)
        if fill:
            src = chroma(src)
            # tiles should stay opaque; fill remaining magenta with sampled dirt
            arr = np.asarray(src, dtype=np.uint8)
            if arr[..., 3].mean() < 250:
                opaque = arr[..., 3] > 32
                if opaque.any():
                    fill_rgb = tuple(int(x) for x in arr[opaque].mean(axis=0)[:3])
                else:
                    fill_rgb = (118, 72, 48)
                bg = Image.new("RGBA", src.size, (*fill_rgb, 255))
                bg.paste(src, mask=src.split()[-1])
                src = bg
        fitted = fit(src, size, fill=fill)
        if name == "truck":
            fitted = greener_truck(fitted)
        # Binary alpha: 16x16 pixel art should not carry semi-transparent fringes.
        arr = np.asarray(fitted, dtype=np.uint8).copy()
        arr[arr[:, :, 3] < 32] = 0
        arr[arr[:, :, 3] >= 32, 3] = 255
        fitted = Image.fromarray(arr, "RGBA")
        frames[name] = quantize_rgba(fitted, palette)

    frames["tile_path"] = paint_path_dashes(frames["tile_path"])
    frames["tile_median"] = paint_median_flowers(frames["tile_median"])
    frames["tile_spa"] = paint_spa_details(frames["tile_spa"])
    frames["capy_up_2"] = quantize_rgba(waddle(frames["capy_up_1"]), palette)
    frames["capy_right_1"] = frames["capy_left_1"].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    frames["capy_right_2"] = frames["capy_left_2"].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    frames["capy_defeat"] = ensure_zzz(frames["capy_defeat"])

    # 128x128 atlas, 16x16 grid. Wide sprites occupy two cells.
    layout: list[tuple[str, int, int]] = [
        ("capy_up_1", 0, 0),
        ("capy_up_2", 1, 0),
        ("capy_down_1", 2, 0),
        ("capy_down_2", 3, 0),
        ("capy_left_1", 4, 0),
        ("capy_left_2", 5, 0),
        ("capy_right_1", 6, 0),
        ("capy_right_2", 7, 0),
        ("capy_defeat", 0, 1),
        ("tile_start", 0, 2),
        ("tile_path", 1, 2),
        ("tile_median", 2, 2),
        ("tile_spa", 3, 2),
        ("atv_red", 0, 3),
        ("atv_blue", 1, 3),
        ("truck", 2, 3),
        ("monkey", 4, 3),
        ("parrot", 5, 3),
        ("log", 0, 4),
    ]

    sheet = Image.new("RGBA", (SHEET, SHEET), (0, 0, 0, 0))
    placed = []
    for name, col, row in layout:
        im = frames[name]
        xy = (col * CELL, row * CELL)
        sheet.paste(im, xy, im)
        placed.append(
            {
                "name": name,
                "x": xy[0],
                "y": xy[1],
                "w": im.width,
                "h": im.height,
                "col": col,
                "row": row,
            }
        )
        frames[name].save(FRAMES / f"{name}.png")

    sheet.save(OUT_SHEET)
    nearest_resize(sheet, (SHEET * 8, SHEET * 8)).save(OUT_PREVIEW)

    manifest = {
        "name": "capybara_crossing",
        "tile_size": CELL,
        "sheet_size": [SHEET, SHEET],
        "image": OUT_SHEET.name,
        "palette": PALETTE.name,
        "frames": placed,
        "animations": {
            "idle_up": ["capy_up_1", "capy_up_2"],
            "walk_down": ["capy_down_1", "capy_down_2"],
            "walk_left": ["capy_left_1", "capy_left_2"],
            "walk_right": ["capy_right_1", "capy_right_2"],
            "defeat": ["capy_defeat"],
        },
        "tiles": ["tile_start", "tile_path", "tile_median", "tile_spa"],
        "hazards": ["atv_red", "atv_blue", "truck", "log", "monkey", "parrot"],
    }
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {OUT_SHEET} {sheet.size}")
    print(f"Wrote {OUT_PREVIEW}")
    print(f"Wrote {OUT_MANIFEST}")
    print(f"Wrote {len(placed)} frames in {FRAMES}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
