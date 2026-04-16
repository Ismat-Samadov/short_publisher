"""
pipeline.py — YouTube Shorts autonomous publisher

Stack:
  Script  : Claude claude-sonnet-4-6 (hook-first viral formula)
  Audio   : ElevenLabs (premium voice + word timestamps for captions)
  Video   : Kling 2.6 Pro via fal.ai (cinematic 9:16, parallel generation)
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


def load_secrets_from_dashboard() -> None:
    """
    Fetch all secrets stored in the dashboard DB and inject them into os.environ.
    This means GitHub Actions only needs APP_URL + PIPELINE_SECRET_KEY.
    Everything else (API keys, tokens) is managed from the admin panel.
    """
    try:
        resp = requests.get(
            f"{APP_URL}/api/secrets",
            headers=HEADERS,
            timeout=15,
        )
        if not resp.ok:
            print(f"[Secrets] Failed to load from dashboard ({resp.status_code}). Using local env vars.")
            return
        secrets = resp.json()
        loaded = 0
        for key, value in secrets.items():
            if value and not os.environ.get(key):  # env var overrides DB (local dev)
                os.environ[key] = value
                loaded += 1
        print(f"[Secrets] Loaded {loaded} secrets from dashboard DB.")
    except Exception as e:
        print(f"[Secrets] Could not reach dashboard ({e}). Falling back to local env vars.")


def fetch_pipeline_config() -> dict:
    """Fetch dashboard settings (non-secret config) at startup."""
    defaults = {
        "schedule_enabled": "true",
        "youtube_visibility": "public",
        "youtube_category_id": "28",
        "youtube_made_for_kids": "false",
        "video_duration_target": "30",
        "max_clips": "3",
        "script_tone": "educational",
        "default_niche": "Technology",
        "elevenlabs_voice_id": "",
    }
    try:
        resp = requests.get(
            f"{APP_URL}/api/settings/pipeline",
            headers=HEADERS,
            timeout=10,
        )
        if resp.ok:
            return {**defaults, **resp.json()}
    except Exception as e:
        print(f"[Config] Could not fetch dashboard settings ({e}), using defaults.")
    return defaults


# Loaded once at startup
CONFIG: dict = {}


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
    tone = CONFIG.get("script_tone", "educational")
    niche = topic.niche or CONFIG.get("default_niche", "Technology")
    duration_target = int(CONFIG.get("video_duration_target", "30"))
    max_clips = int(CONFIG.get("max_clips", "3"))
    _log("2/8", f"Generating viral script (Claude claude-sonnet-4-6) tone={tone} target={duration_target}s max_clips={max_clips}")
    return generate_script(
        topic_title=topic.title,
        topic_description=topic.description,
        niche=niche,
        keywords=topic.keywords,
        tone=tone,
        duration_target=duration_target,
        max_segments=max_clips,
    )


def step_generate_audio(script: dict, work_dir: str) -> tuple[str, list[dict], float, dict]:
    _log("3/8", "Generating voiceover (ElevenLabs)")
    audio_path = str(Path(work_dir) / "audio.mp3")
    word_timestamps, duration, audio_usage = generate_audio(script["script"], audio_path)
    return audio_path, word_timestamps, duration, audio_usage


def step_generate_clips(script: dict, work_dir: str) -> tuple[list[str], int]:
    _log("4/8", "Generating cinematic clips (Kling 2.6 Pro via fal.ai)")
    clips_dir = str(Path(work_dir) / "clips")
    prompts = [seg["visual_prompt"] for seg in script["segments"]]
    clip_paths = generate_video_clips(prompts, clips_dir)
    return clip_paths, len(prompts)  # return attempted count for accurate billing


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
    captions_enabled: bool = True,
) -> str:
    _log("5/8", f"Assembling final video (FFmpeg) captions={'on' if captions_enabled else 'off'}")
    output_path = str(Path(work_dir) / "final.mp4")
    assemble_video(
        clip_paths=clip_paths,
        audio_path=audio_path,
        output_path=output_path,
        word_timestamps=word_timestamps if captions_enabled else [],
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

    visibility = CONFIG.get("youtube_visibility", "public")
    category_id = CONFIG.get("youtube_category_id", "28")
    made_for_kids_raw = CONFIG.get("youtube_made_for_kids", "false")
    made_for_kids = made_for_kids_raw.lower() == "true"

    _log("7/8", f"Uploading to YouTube (visibility={visibility}, category={category_id})")
    return upload_to_youtube(
        video_path=video_path,
        title=script["title"],
        description=script["description"],
        hashtags=script["hashtags"],
        category_id=category_id,
        privacy_status=visibility,
        made_for_kids=made_for_kids,
    )


def step_report(
    topic: Topic,
    script: Optional[dict],
    youtube_id: Optional[str],
    r2_key: Optional[str],
    duration: int,
    status: str,
    error: Optional[str] = None,
    cost_metadata: Optional[dict] = None,
) -> None:
    _log("8/8", f"Reporting {status}")
    yt_url = None
    if youtube_id and youtube_id != "dry_run_id":
        yt_url = f"https://www.youtube.com/shorts/{youtube_id}"

    payload: dict = {
        "topic_id": topic.id,
        "duration_seconds": duration,
        "status": status,
    }
    if script:
        payload["title"] = script["title"]
        payload["script"] = script["script"]
    if yt_url:
        payload["youtube_url"] = yt_url
    if youtube_id:
        payload["youtube_id"] = youtube_id
    if r2_key:
        payload["r2_key"] = r2_key
    if error:
        payload["error_message"] = error
    if cost_metadata:
        payload["metadata"] = cost_metadata

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
    global CONFIG
    # Load secrets from dashboard DB first — this populates os.environ
    # so all downstream scripts (generate_script, generate_audio, etc.) work
    load_secrets_from_dashboard()
    CONFIG = fetch_pipeline_config()

    print("=" * 60)
    print(f"Short Publisher Pipeline — {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC")
    if DRY_RUN:
        print("DRY RUN — YouTube upload will be skipped")
    print(f"Config: visibility={CONFIG.get('youtube_visibility')} | category={CONFIG.get('youtube_category_id')} | tone={CONFIG.get('script_tone')}")
    print("=" * 60)

    # Respect the dashboard's schedule_enabled toggle
    if CONFIG.get("schedule_enabled", "true").lower() == "false" and not DRY_RUN:
        print("\n[Pipeline] Auto-publish is disabled in dashboard settings. Exiting.")
        sys.exit(0)

    topic: Optional[Topic] = None
    script: Optional[dict] = None
    work_dir: Optional[str] = None
    r2_key: Optional[str] = None
    youtube_id: Optional[str] = None
    duration: int = 0
    current_step = "init"
    # Track partial costs so failures still get recorded
    audio_usage: dict = {}
    clips_attempted: int = 0
    clip_paths: list = []

    try:
        current_step = "fetch-topic"
        topic = step_fetch_topic()

        work_dir = tempfile.mkdtemp(prefix="short_pub_")

        current_step = "generate-script"
        script = step_generate_script(topic)

        current_step = "generate-audio"
        audio_path, word_timestamps, audio_duration, audio_usage = step_generate_audio(script, work_dir)
        duration = int(audio_duration)

        current_step = "generate-clips"
        clip_paths, clips_attempted = step_generate_clips(script, work_dir)

        bg_music = step_fetch_bg_music(work_dir)

        current_step = "assemble"
        captions_enabled = CONFIG.get("captions_enabled", "true").lower() == "true"
        video_path = step_assemble(clip_paths, audio_path, word_timestamps, bg_music, work_dir, captions_enabled=captions_enabled)

        current_step = "upload-r2"
        r2_key, _ = step_upload_r2(video_path, topic.id)

        current_step = "upload-youtube"
        youtube_id = step_upload_youtube(video_path, script)

        current_step = "report"
        # Build cost breakdown
        script_usage = script.get("_usage", {})
        # fal.ai bills 20s minimum per Kling v2.6 pro request regardless of CLIP_DURATION
        kling_cost = clips_attempted * 1.40  # $0.07/s × 20s × N attempted
        total_cost = (
            script_usage.get("claude_cost_usd", 0)
            + audio_usage.get("elevenlabs_cost_usd", 0)
            + kling_cost
        )
        cost_metadata = {
            "claude": {
                "input_tokens": script_usage.get("input_tokens", 0),
                "output_tokens": script_usage.get("output_tokens", 0),
                "cost_usd": script_usage.get("claude_cost_usd", 0),
            },
            "elevenlabs": {
                "chars": audio_usage.get("chars", 0),
                "cost_usd": audio_usage.get("elevenlabs_cost_usd", 0),
            },
            "kling": {
                "clips": clips_attempted,
                "clips_ok": len(clip_paths),
                "cost_usd": round(kling_cost, 4),
            },
            "total_usd": round(total_cost, 4),
        }
        print(f"\n  Cost breakdown:")
        print(f"    Claude     : ${script_usage.get('claude_cost_usd', 0):.4f}")
        print(f"    ElevenLabs : ${audio_usage.get('elevenlabs_cost_usd', 0):.4f}")
        print(f"    Kling      : ${kling_cost:.4f} ({clips_attempted} attempted, {len(clip_paths)} ok)")
        print(f"    Total      : ${total_cost:.4f}")
        step_report(topic, script, youtube_id, r2_key, duration, "published", cost_metadata=cost_metadata)

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
            # Build partial cost metadata — captures whatever was already billed
            script_usage = (script or {}).get("_usage", {})
            kling_cost = clips_attempted * 1.40
            partial_cost = {
                "claude": {
                    "input_tokens": script_usage.get("input_tokens", 0),
                    "output_tokens": script_usage.get("output_tokens", 0),
                    "cost_usd": script_usage.get("claude_cost_usd", 0),
                },
                "elevenlabs": {
                    "chars": audio_usage.get("chars", 0),
                    "cost_usd": audio_usage.get("elevenlabs_cost_usd", 0),
                },
                "kling": {
                    "clips": clips_attempted,
                    "clips_ok": len(clip_paths),
                    "cost_usd": round(kling_cost, 4),
                },
                "total_usd": round(
                    script_usage.get("claude_cost_usd", 0)
                    + audio_usage.get("elevenlabs_cost_usd", 0)
                    + kling_cost, 4
                ),
            }
            step_report(topic, script, None, r2_key, duration, "failed", msg, cost_metadata=partial_cost)

        sys.exit(1)

    finally:
        if work_dir and Path(work_dir).exists():
            shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
