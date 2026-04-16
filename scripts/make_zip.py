import zipfile
import os

source = r"C:\Users\iasamadov\Desktop\projects\short_publisher"
dest = r"C:\Users\iasamadov\Desktop\short_publisher_gumroad.zip"

exclude_dirs = {".git", ".next", "node_modules", ".claude", "screens"}
exclude_files = {
    ".env.local",
    "client_secret_947501024874-cnig3gvpgbk02m5ftbu9491sqhn1jtgs.apps.googleusercontent.com.json",
    "make_square_thumbnail.py",
    "make_zip.py",
}

count = 0
with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(source):
        # Prune excluded dirs in-place
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            if file in exclude_files:
                continue
            abs_path = os.path.join(root, file)
            arcname = os.path.relpath(abs_path, source)
            zf.write(abs_path, arcname)
            count += 1

print(f"Done: {count} files -> {dest}")
