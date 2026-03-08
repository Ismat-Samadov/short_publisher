"""
generate_visuals.py
Fetches or generates portrait images (1080x1920) for the video.
Uses Pexels API for stock photos, falls back to PIL-generated gradients.
"""

import os
import re
import math
import random
import requests
from pathlib import Path
from typing import Optional

# Target portrait resolution for YouTube Shorts
TARGET_WIDTH = 1080
TARGET_HEIGHT = 1920


def generate_visuals(
    script: str,
    niche: str,
    num_images: int,
    output_dir: str,
) -> list[str]:
    """
    Generate/fetch portrait images for the video.

    Args:
        script: The full video script (used to extract search terms)
        niche: The video niche (e.g. 'Technology', 'Finance')
        num_images: How many images to produce
        output_dir: Directory to save images

    Returns:
        List of absolute file paths to the generated images
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    pexels_key = os.environ.get("PEXELS_API_KEY", "")

    # Extract search queries from the script
    queries = _extract_search_queries(script, niche, num_images)
    print(f"[generate_visuals] Search queries: {queries}")

    image_paths: list[str] = []

    for i, query in enumerate(queries):
        out_path = str(Path(output_dir) / f"image_{i:03d}.jpg")

        if pexels_key:
            success = _fetch_pexels_image(query, out_path, pexels_key)
            if success:
                image_paths.append(out_path)
                print(f"[generate_visuals] [{i+1}/{num_images}] Pexels: {query}")
                continue

        # Fallback: generate gradient image
        _generate_gradient_image(query, out_path, i)
        image_paths.append(out_path)
        print(f"[generate_visuals] [{i+1}/{num_images}] Generated gradient for: {query}")

    return image_paths


def _extract_search_queries(script: str, niche: str, count: int) -> list[str]:
    """Extract relevant search terms from the script text."""
    # Split script into rough segments
    sentences = re.split(r'[.!?]+', script)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    queries = []
    for sentence in sentences[:count]:
        # Extract first few meaningful words as search query
        words = sentence.split()
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
                      'to', 'for', 'of', 'with', 'by', 'from', 'is', 'it',
                      'this', 'that', 'you', 'your', 'we', 'our', 'i', 'my'}
        meaningful = [w for w in words if w.lower() not in stop_words and len(w) > 2]
        query = ' '.join(meaningful[:4]) if meaningful else niche
        queries.append(query or niche)

    # Pad with niche queries if needed
    while len(queries) < count:
        queries.append(f"{niche} concept")

    return queries[:count]


def _fetch_pexels_image(query: str, output_path: str, api_key: str) -> bool:
    """
    Fetch a portrait image from Pexels and save it to output_path.
    Returns True on success.
    """
    try:
        url = "https://api.pexels.com/v1/search"
        params = {
            "query": query,
            "orientation": "portrait",
            "size": "large",
            "per_page": 5,
        }
        headers = {"Authorization": api_key}

        resp = requests.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()

        data = resp.json()
        photos = data.get("photos", [])

        if not photos:
            return False

        # Pick a random photo from results
        photo = random.choice(photos)
        image_url = photo["src"]["portrait"]  # 800x1200 portrait

        img_resp = requests.get(image_url, timeout=30)
        img_resp.raise_for_status()

        # Save and resize to exact 1080x1920
        _save_and_resize(img_resp.content, output_path)
        return True

    except Exception as e:
        print(f"[generate_visuals] Pexels error for '{query}': {e}")
        return False


def _save_and_resize(image_data: bytes, output_path: str) -> None:
    """Save image data to file, resizing/cropping to 1080x1920."""
    from PIL import Image
    import io

    img = Image.open(io.BytesIO(image_data)).convert("RGB")

    # Calculate crop to maintain aspect ratio 9:16
    target_ratio = TARGET_WIDTH / TARGET_HEIGHT
    img_ratio = img.width / img.height

    if img_ratio > target_ratio:
        # Image is wider than needed — crop width
        new_width = int(img.height * target_ratio)
        offset = (img.width - new_width) // 2
        img = img.crop((offset, 0, offset + new_width, img.height))
    else:
        # Image is taller than needed — crop height
        new_height = int(img.width / target_ratio)
        offset = (img.height - new_height) // 2
        img = img.crop((0, offset, img.width, offset + new_height))

    img = img.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.LANCZOS)
    img.save(output_path, "JPEG", quality=90)


def _generate_gradient_image(label: str, output_path: str, index: int) -> None:
    """Generate a simple gradient image with text overlay as fallback."""
    from PIL import Image, ImageDraw, ImageFont

    # Palette of gradient color pairs
    palettes = [
        ((15, 15, 35), (45, 20, 80)),    # deep purple
        ((10, 25, 50), (20, 60, 120)),   # deep blue
        ((30, 10, 10), (90, 20, 20)),    # deep red
        ((10, 30, 20), (20, 80, 50)),    # deep green
        ((30, 20, 5), (90, 60, 10)),     # deep amber
    ]
    color_top, color_bottom = palettes[index % len(palettes)]

    img = Image.new("RGB", (TARGET_WIDTH, TARGET_HEIGHT))
    draw = ImageDraw.Draw(img)

    # Draw vertical gradient
    for y in range(TARGET_HEIGHT):
        ratio = y / TARGET_HEIGHT
        r = int(color_top[0] + (color_bottom[0] - color_top[0]) * ratio)
        g = int(color_top[1] + (color_bottom[1] - color_top[1]) * ratio)
        b = int(color_top[2] + (color_bottom[2] - color_top[2]) * ratio)
        draw.line([(0, y), (TARGET_WIDTH, y)], fill=(r, g, b))

    # Add subtle grid pattern for depth
    for x in range(0, TARGET_WIDTH, 80):
        draw.line([(x, 0), (x, TARGET_HEIGHT)], fill=(255, 255, 255, 10), width=1)
    for y in range(0, TARGET_HEIGHT, 80):
        draw.line([(0, y), (TARGET_WIDTH, y)], fill=(255, 255, 255, 10), width=1)

    # Add text label
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
    except OSError:
        font = ImageFont.load_default()

    # Word-wrap label
    words = label.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] > TARGET_WIDTH - 120:
            if current:
                lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)

    # Draw text centered
    total_height = len(lines) * 60
    y_start = (TARGET_HEIGHT - total_height) // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (TARGET_WIDTH - (bbox[2] - bbox[0])) // 2
        y = y_start + i * 60
        # Shadow
        draw.text((x + 2, y + 2), line, fill=(0, 0, 0, 180), font=font)
        draw.text((x, y), line, fill=(255, 255, 255), font=font)

    img.save(output_path, "JPEG", quality=90)
