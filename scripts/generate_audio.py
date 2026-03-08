"""
generate_audio.py

Generates voiceover using ElevenLabs with character-level timestamps.
Word timestamps are used downstream to create dynamic burned-in captions.

Returns: (audio_path, word_timestamps, duration_seconds)
word_timestamps: [{"word": str, "start": float, "end": float}, ...]
"""

import os
import base64
import json
import requests
from pathlib import Path


# ElevenLabs models: eleven_multilingual_v2 = best quality
ELEVENLABS_MODEL = "eleven_multilingual_v2"

# Default voice: Adam (natural, authoritative) — override with ELEVENLABS_VOICE_ID
DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"


def generate_audio(
    script: str,
    output_path: str,
) -> tuple[list[dict], float]:
    """
    Generate audio with word-level timestamps using ElevenLabs.

    Returns:
        (word_timestamps, duration_seconds)
        word_timestamps: [{"word": str, "start": float, "end": float}, ...]
        Audio is saved to output_path.
    """
    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is required. No fallback — quality matters.")

    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    print(f"  Voice ID : {voice_id}")
    print(f"  Model    : {ELEVENLABS_MODEL}")
    print(f"  Words    : {len(script.split())}")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "text": script,
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.80,
            "style": 0.35,
            "use_speaker_boost": True,
        },
        "output_format": "mp3_44100_128",
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=120)

    if resp.status_code != 200:
        raise RuntimeError(
            f"ElevenLabs API error {resp.status_code}: {resp.text[:300]}"
        )

    data = resp.json()

    # Decode and save audio
    audio_bytes = base64.b64decode(data["audio_base64"])
    with open(output_path, "wb") as f:
        f.write(audio_bytes)

    # Convert character timestamps → word timestamps
    alignment = data.get("alignment", {})
    word_timestamps = _chars_to_words(
        alignment.get("characters", []),
        alignment.get("character_start_times_seconds", []),
        alignment.get("character_end_times_seconds", []),
    )

    duration = word_timestamps[-1]["end"] if word_timestamps else _estimate_duration(script)

    print(f"  Duration : {duration:.1f}s")
    print(f"  Caption words: {len(word_timestamps)}")

    return word_timestamps, duration


def _chars_to_words(
    chars: list[str],
    starts: list[float],
    ends: list[float],
) -> list[dict]:
    """Convert character-level timestamps to word-level timestamps."""
    if not chars:
        return []

    words = []
    current_word = ""
    word_start = 0.0
    word_end = 0.0

    for char, start, end in zip(chars, starts, ends):
        if char in (" ", "\n", "\t"):
            if current_word.strip():
                words.append({
                    "word": current_word.strip(),
                    "start": word_start,
                    "end": word_end,
                })
            current_word = ""
        else:
            if not current_word:
                word_start = start
            current_word += char
            word_end = end

    if current_word.strip():
        words.append({
            "word": current_word.strip(),
            "start": word_start,
            "end": word_end,
        })

    return words


def _estimate_duration(script: str) -> float:
    """Fallback: estimate duration at 145 words/minute (natural speaking pace)."""
    return (len(script.split()) / 145.0) * 60.0
