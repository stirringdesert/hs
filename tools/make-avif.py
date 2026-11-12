#!/usr/bin/env python3
"""Makes a smaller AVIF copy next to each voice-role and trailer picture.

The pages offer the AVIF first and keep the JPG as the fallback, so phones download
about 40% less with no visible difference. Run it after adding or replacing a picture:
    python3 tools/make-avif.py
Needs Python with Pillow 11+ (AVIF support). Existing AVIFs are only remade when the
JPG is newer.
"""
import glob, os
from PIL import Image

QUALITY = 72  # SSIM against the JPG stays at about 0.98-0.99: indistinguishable on screen

files = glob.glob('assets/img/voice/*.jpg') + glob.glob('assets/img/theater/*.jpg')
for jpg in sorted(files):
    avif = jpg[:-4] + '.avif'
    if os.path.exists(avif) and os.path.getmtime(avif) >= os.path.getmtime(jpg):
        continue
    im = Image.open(jpg)
    im.save(avif, 'AVIF', quality=QUALITY, speed=4, icc_profile=im.info.get('icc_profile'))  # keep its colors
    print(f'{avif}: {os.path.getsize(jpg) // 1024} KB -> {os.path.getsize(avif) // 1024} KB')
