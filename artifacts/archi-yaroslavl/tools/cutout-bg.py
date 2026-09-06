#!/usr/bin/env python3
# ============================================================
# ПУТЬ ARCHI — вырезание фона персонажей (ML, u2net via rembg)
#
# Запуск:
#   PYTHONPATH=/tmp/rembg U2NET_HOME=/tmp/u2net \
#     python3 tools/cutout-bg.py
#
# Зависимости (внешние, не входят в проект):
#   pip3 install --target=/tmp/rembg rembg onnxruntime pillow numpy
#
# Читает оригинальные фотографии public/images/archi/level-*.png
# (фон НЕ трогает) и пишет чистые спрайты с прозрачным фоном
# в public/images/archi/level-*.sprite.png.
# ============================================================

import os
import sys

from PIL import Image, ImageFilter

try:
    import numpy as np
    from rembg import new_session, remove
except ImportError as e:  # pragma: no cover
    sys.exit(
        "Нужны rembg/numpy/pillow. Установите:\n"
        "  pip3 install --target=/tmp/rembg rembg onnxruntime pillow numpy\n"
        "и запустите с PYTHONPATH=/tmp/rembg.\n"
        f"Ошибка импорта: {e}"
    )

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "images", "archi")
FILES = ["level-01.png", "level-10.png", "level-20.png", "level-30.png"]
PAD = 8  # воздух вокруг фигуры после обрезки


def main() -> None:
    session = new_session("u2net")
    for name in FILES:
        src = os.path.join(IMG_DIR, name)
        dst = os.path.join(IMG_DIR, name.replace(".png", ".sprite.png"))
        if not os.path.exists(src):
            print(f"SKIP (нет файла): {src}")
            continue

        img = Image.open(src).convert("RGBA")

        # --- ML-маска фона ---
        cut = remove(
            img,
            session=session,
            post_process_mask=True,  # альфа-маттинг: чистая кромка без ореола
        )
        arr = np.asarray(cut).copy()
        alpha = arr[:, :, 3]

        # --- убираем тонкую «бахрому» фона: эрозия на 1px и снова мягкая кромка ---
        mask = Image.fromarray(alpha)
        mask = mask.filter(ImageFilter.MinFilter(3))  # эрозия
        mask = mask.filter(ImageFilter.GaussianBlur(0.6))
        arr[:, :, 3] = np.asarray(mask)

        cut = Image.fromarray(arr)

        # --- обрезка по bbox с небольшим полем ---
        bbox = cut.getbbox()  # bbox учитывает альфу
        if bbox is None:
            print(f"SKIP (пустая маска): {name}")
            continue
        left, top, right, bottom = bbox
        w = min(cut.width, right + PAD) - max(0, left - PAD)
        h = min(cut.height, bottom + PAD) - max(0, top - PAD)
        cut = cut.crop((max(0, left - PAD), max(0, top - PAD),
                        min(cut.width, right + PAD), min(cut.height, bottom + PAD)))

        cut.save(dst)
        op = sum(1 for px in cut.getdata() if px[3] > 0)
        print(f"{name} -> {os.path.basename(dst)}  "
              f"{cut.width}x{cut.height}  непрозрачных={op/ (cut.width*cut.height):.0%}")


if __name__ == "__main__":
    main()