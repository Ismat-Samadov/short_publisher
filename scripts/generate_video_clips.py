"""
generate_video_clips.py

Generates cinematic 9:16 video clips using Kling 2.6 Pro via fal.ai.
Clips are generated in parallel to minimize total pipeline time.

Model: fal-ai/kling-video/v2.6/pro/text-to-video
- 1080x1920, photorealistic, cinematic
- 10 seconds per clip
- ~$0.70 per clip (10s × $0.07/s)
"""

import os
import requests
import fal_client
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed


FAL_MODEL = "fal-ai/kling-video/v2.6/pro/text-to-video"
CLIP_DURATION = "10"  # seconds per clip — max quality at this length


def generate_video_clips(
    visual_prompts: list[str],
    output_dir: str,
) -> list[str]:
    """
    Generate one 10-second cinematic clip per visual prompt, in parallel.

    Returns list of local file paths in segment order.
    Missing clips (failures) are skipped — pipeline continues with available clips.
    """
    os.environ.setdefault("FAL_KEY", os.environ.get("FAL_KEY", ""))

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    total = len(visual_prompts)
    print(f"  Generating {total} clips in parallel (Kling 2.5 Pro, 10s each)...")
    print(f"  Estimated cost: ~${total * 0.70:.2f}")

    results: dict[int, str] = {}

    def generate_one(index: int, prompt: str) -> tuple[int, str]:
        clip_path = str(Path(output_dir) / f"clip_{index:02d}.mp4")

        try:
            result = fal_client.subscribe(
                FAL_MODEL,
                arguments={
                    "prompt": prompt,
                    "duration": CLIP_DURATION,
                    "aspect_ratio": "9:16",
                    "cfg_scale": 0.5,
                },
            )

            video_url = result["video"]["url"]

            resp = requests.get(video_url, timeout=120, stream=True)
            resp.raise_for_status()

            with open(clip_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=65536):
                    f.write(chunk)

            size_mb = Path(clip_path).stat().st_size / (1024 * 1024)
            print(f"  ✓ Clip {index + 1}/{total} downloaded ({size_mb:.1f} MB)")
            return index, clip_path

        except Exception as e:
            print(f"  ✗ Clip {index + 1}/{total} failed: {e}")
            raise

    # Run up to 4 clips in parallel (fal.ai handles queue on their end)
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(generate_one, i, prompt): i
            for i, prompt in enumerate(visual_prompts)
        }
        for future in as_completed(futures):
            try:
                idx, path = future.result()
                results[idx] = path
            except Exception:
                pass  # already logged inside generate_one

    if not results:
        raise RuntimeError("All video clip generations failed. Check FAL_KEY and fal.ai quota.")

    # Return clips in original order, skipping any that failed
    clips = [results[i] for i in sorted(results.keys())]
    print(f"  Generated {len(clips)}/{total} clips successfully")
    return clips
