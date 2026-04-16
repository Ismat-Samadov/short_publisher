from PIL import Image

input_path = r"../screens/Screenshot 2026-03-13 052423.png"
output_path = "../screens/gumroad_thumbnail.png"
size = 800

img = Image.open(input_path)
w, h = img.size

# Create square dark background
bg = Image.new("RGB", (size, size), (9, 9, 11))  # #09090b

# Scale image to fit width
scale = size / w
new_w = size
new_h = int(h * scale)
img_resized = img.resize((new_w, new_h), Image.LANCZOS)

# Paste centered vertically
y_offset = (size - new_h) // 2
bg.paste(img_resized, (0, y_offset))

bg.save(output_path, "PNG")
print(f"Saved {size}x{size} to {output_path}")
