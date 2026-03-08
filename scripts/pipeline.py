"""
pipeline.py — YouTube Shorts autonomous publisher

Stack:
  Script  : Claude claude-sonnet-4-6 (hook-first viral formula)
  Audio   : ElevenLabs (premium voice + word timestamps for captions)
  Video   : Kling 2.5 Pro via fal.ai (cinematic 9:16, parallel generation)
  Assembly: FFmpeg (normalize + concat + audio mix + burned ASS captions)
  Upload  : YouTube Data API v3

Cost per Short: ~$3–5 (Kling clips dominate the cost)
"""

import os
import sys
import json
import shutil
import tempfile
import traceback
import requests
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from generate_script import generate_script
from generate_audio import generate_audio
from generate_video_clips import generate_video_clips
from assemble_video import assemble_video
from upload_r2 import upload_file_to_r2
from upload_youtube import upload_to_youtube

# ── Config ───────────────────────────────────────────────────────────────────

APP_URL = os.environ["APP_URL"].rstrip("/")
PIPELINE_KEY = os.environ["PIPELINE_SECRET_KEY"]
DRY_RUN = os.environ.get("DRY_RUN", "false").lower() == "true"
BG_MUSIC_URL = os.environ.get("BACKGROUND_MUSIC_URL", "")

HEADERS = {
    "x-pipeline-key": PIPELINE_KEY,
    "Content-Type": "application/json",
}


# ── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class Topic:
    id: str
    title: str
    description: Optional[str]
    niche: Optional[str]
    keywords: list[str]

    @classmethod
    def from_dict(cls, d: dict) -> "Topic":
        return cls(
            id=d["id"],
            title=d["title"],
            description=d.get("description"),
            niche=d.get("niche", "general"),
            keywords=d.get("keywords") or [],
        )


# ── Steps ────────────────────────────────────────────────────────────────────

def step_fetch_topic() -> Topic:
    _log("1/8", "Fetching next topic")
    resp = requests.get(f"{APP_URL}/api/topics/next", headers=HEADERS, timeout=30)
    if resp.status_code == 404:
        print("\n[Pipeline] No queued topics. Add topics in the dashboard.")
        sys.exit(0)
    resp.raise_for_status()
    topic = Topic.from_dict(resp.json())
    print(f"         → {topic.title}")
    return topic


def step_generate_script(topic: Topic) -> dict:
    _log("2/8", "Generating viral script (Claude claude-sonnet-4-6)")
    return generate_script(
        topic_title=topic.title,
        topic_description=topic.description,
        niche=topic.niche,
        keywords=topic.keywords,
    )


def step_generate_audio(script: dict, work_dir: str) -> tuple[str, list[dict], float]:
    _log("3/8", "Generating voiceover (ElevenLabs)")
    audio_path = str(Path(work_dir) / "audio.mp3")
    word_timestamps, duration = generate_audio(script["script"], audio_path)
    return audio_path, word_timestamps, duration


def step_generate_clips(script: dict, work_dir: str) -> list[str]:
    _log("4/8", "Generating cinematic clips (Kling 2.5 Pro via fal.ai)")
    clips_dir = str(Path(work_dir) / "clips")
    prompts = [seg["visual_prompt"] for seg in script["segments"]]
    return generate_video_clips(prompts, clips_dir)


def step_fetch_bg_music(work_dir: str) -> Optional[str]:
    """Download background music if URL is configured."""
    if not BG_MUSIC_URL:
        return None
    music_path = str(Path(work_dir) / "bg_music.mp3")
    try:
        print("         → Downloading background music...")
        resp = requests.get(BG_MUSIC_URL, timeout=60, stream=True)
        resp.raise_for_status()
        with open(music_path, "wb") as f:
            for chunk in resp.iter_content(65536):
                f.write(chunk)
        return music_path
    except Exception as e:
        print(f"         → BG music download failed (skipping): {e}")
        return None


def step_assemble(
    clip_paths: list[str],
    audio_path: str,
    word_timestamps: list[dict],
    bg_music_path: Optional[str],
    work_dir: str,
) -> str:
    _log("5/8", "Assembling final video (FFmpeg)")
    output_path = str(Path(work_dir) / "final.mp4")
    assemble_video(
        clip_paths=clip_paths,
        audio_path=audio_path,
        output_path=output_path,
        word_timestamps=word_timestamps,
        bg_music_path=bg_music_path,
    )
    return output_path


def step_upload_r2(video_path: str, topic_id: str) -> tuple[str, str]:
    _log("6/8", "Uploading to Cloudflare R2")
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    key = f"videos/{topic_id}/{ts}.mp4"
    url = upload_file_to_r2(video_path, key, "video/mp4")
    print(f"         → {url}")
    return key, url


def step_upload_youtube(video_path: str, script: dict) -> str:
    if DRY_RUN:
        _log("7/8", "YouTube upload — SKIPPED (dry run)")
        return "dry_run_id"
    _log("7/8", "Uploading to YouTube")
    return upload_to_youtube(
        video_path=video_path,
        title=script["title"],
        description=script["description"],
        hashtags=script["hashtags"],
    )


def step_report(
    topic: Topic,
    script: Optional[dict],
    youtube_id: Optional[str],
    r2_key: Optional[str],
    duration: int,
    status: str,
    error: Optional[str] = None,
) -> None:
    _log("8/8", f"Reporting {status}")
    yt_url = None
    if youtube_id and youtube_id != "dry_run_id":
        yt_url = f"https://www.youtube.com/shorts/{youtube_id}"

    payload = {
        "topic_id": topic.id,
        "title": script["title"] if script else None,
        "script": script["script"] if script else None,
        "youtube_url": yt_url,
        "youtube_id": youtube_id,
        "r2_key": r2_key,
        "duration_seconds": duration,
        "status": status,
        "error_message": error,
    }

    try:
        resp = requests.post(
            f"{APP_URL}/api/videos/complete",
            headers=HEADERS,
            json=payload,
            timeout=30,
        )
        if not resp.ok:
            print(f"         → Warning: report failed {resp.status_code}")
    except Exception as e:
        print(f"         → Warning: could not report: {e}")


def _notify_telegram(step: str, error: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": f"❌ <b>Pipeline failed</b>\nStep: {step}\n<code>{error[:400]}</code>",
                "parse_mode": "HTML",
            },
            timeout=10,
        )
    except Exception:
        pass


def _log(step: str, msg: str) -> None:
    print(f"\n[{step}] {msg}")


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print(f"Short Publisher Pipeline — {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC")
    if DRY_RUN:
        print("DRY RUN — YouTube upload will be skipped")
    print("=" * 60)

    topic: Optional[Topic] = None
    script: Optional[dict] = None
    work_dir: Optional[str] = None
    r2_key: Optional[str] = None
    youtube_id: Optional[str] = None
    duration: int = 0
    current_step = "init"

    try:
        current_step = "fetch-topic"
        topic = step_fetch_topic()

        work_dir = tempfile.mkdtemp(prefix="short_pub_")

        current_step = "generate-script"
        script = step_generate_script(topic)

        current_step = "generate-audio"
        audio_path, word_timestamps, audio_duration = step_generate_audio(script, work_dir)
        duration = int(audio_duration)

        current_step = "generate-clips"
        clip_paths = step_generate_clips(script, work_dir)

        bg_music = step_fetch_bg_music(work_dir)

        current_step = "assemble"
        video_path = step_assemble(clip_paths, audio_path, word_timestamps, bg_music, work_dir)

        current_step = "upload-r2"
        r2_key, _ = step_upload_r2(video_path, topic.id)

        current_step = "upload-youtube"
        youtube_id = step_upload_youtube(video_path, script)

        current_step = "report"
        step_report(topic, script, youtube_id, r2_key, duration, "published")

        print("\n" + "=" * 60)
        print("✓ Pipeline complete!")
        if youtube_id and not DRY_RUN:
            print(f"  https://www.youtube.com/shorts/{youtube_id}")
        print("=" * 60)

    except SystemExit:
        raise

    except Exception as e:
        msg = f"{type(e).__name__}: {e}"
        print(f"\n✗ Pipeline failed at '{current_step}':\n{traceback.format_exc()}")
        _notify_telegram(current_step, msg)

        if topic:
            step_report(topic, script, None, r2_key, duration, "failed", msg)

        sys.exit(1)

    finally:
        if work_dir and Path(work_dir).exists():
            shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
