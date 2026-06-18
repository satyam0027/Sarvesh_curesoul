from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\Admin\.cursor\projects\d-SARVESH-MISHRA\assets\c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_e03b5e20a9df7a9b2cb736983c1a9e6a_images_WhatsApp_Image_2026-06-18_at_11.43.39_AM-97fabca0-a3de-4809-9723-210073add692.png"
)
out = Path(r"D:\SARVESH MISHRA\assets")
images = out / "images"
images.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGB")
w, h = img.size
size = int(min(w, h) * 0.72)
left = (w - size) // 2
top = int(h * 0.06)
crop = img.crop((left, top, left + size, top + size))

crop.save(images / "sarvesh-mishra-favicon-source.png", optimize=True)

sizes = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}
for name, px in sizes.items():
    crop.resize((px, px), Image.Resampling.LANCZOS).save(out / name, optimize=True)

ico_sizes = [(16, 16), (32, 32), (48, 48)]
crop.resize((48, 48), Image.Resampling.LANCZOS).save(
    out / "favicon.ico",
    format="ICO",
    sizes=ico_sizes,
)

manifest = """{
  "name": "Sarvesh Mishra",
  "short_name": "Sarvesh Mishra",
  "icons": [
    {"src": "/assets/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/assets/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"}
  ],
  "theme_color": "#113a35",
  "background_color": "#ffffff",
  "display": "standalone"
}
"""
(out / "site.webmanifest").write_text(manifest, encoding="utf-8")
print("Done")
