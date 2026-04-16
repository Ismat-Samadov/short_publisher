"""
assemble_video.py

Assembles the final YouTube Short from Kling video clips + ElevenLabs audio.

Pipeline:
  1. Normalize all clips to 1080x1920 30fps
  2. Concatenate clips
  3. Replace audio: TTS voice (100%) + optional background music (12%)
  4. Burn dynamic word-by-word captions (ASS format, TikTok-style)
  5. Output: 1080x1920 H.264 MP4, ready for YouTube Shorts
"""

import os
import json
import subprocess
import tempfile
from pathlib import Path


TARGET_W = 1080
TARGET_H = 1920
FPS = 30

# Caption style — TikTok/Reels aesthetic
CAPTION_FONT = "DejaVu-Sans-Bold"   # always available on Ubuntu runners
CAPTION_SIZE = 88                    # px at 1080 wide
CAPTION_WORDS_PER_LINE = 4          # words per caption block
CAPTION_MARGIN_V = 200              # pixels from bottom edge


def assemble_video(
    clip_paths: list[str],
    audio_path: str,
    output_path: str,
    word_timestamps: list[dict],
    bg_music_path: str | None = None,
) -> None:
    """
    Assemble the final Short.

    Args:
        clip_paths: Kling 2.5 MP4 clip files in segment order
        audio_path: ElevenLabs TTS MP3
        output_path: destination MP4
        word_timestamps: [{"word": str, "start": float, "end": float}]
        bg_music_path: optional background music MP3 (looped, 12% volume)
    """
    if not clip_paths:
        raise ValueError("No video clips provided")

    work_dir = str(Path(output_path).parent)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    audio_duration = _probe_duration(audio_path)
    print(f"  Audio duration : {audio_duration:.1f}s")
    print(f"  Clips          : {len(clip_paths)}")

    # Step 1: Normalize clips to 1080x1920 30fps
    print("  Normalizing clips...")
    normalized = _normalize_clips(clip_paths, work_dir)

    # Step 2: Concatenate
    print("  Concatenating clips...")
    concat_path = str(Path(work_dir) / "concat.mp4")
    _concat_clips(normalized, concat_path)

    # Step 3: Build ASS caption file
    print("  Building captions...")
    ass_path = str(Path(work_dir) / "captions.ass")
    _write_ass_captions(word_timestamps, audio_duration, ass_path)

    # Step 4: Final assembly — audio mix + captions burned in
    print("  Final FFmpeg assembly...")
    _final_encode(
        video_path=concat_path,
        audio_path=audio_path,
        ass_path=ass_path,
        output_path=output_path,
        audio_duration=audio_duration,
        bg_music_path=bg_music_path,
    )

    size_mb = Path(output_path).stat().st_size / (1024 * 1024)
    print(f"  Output : {output_path} ({size_mb:.1f} MB)")


# ── Step helpers ────────────────────────────────────────────────────────────

def _normalize_clips(clip_paths: list[str], work_dir: str) -> list[str]:
    """Re-encode each clip to exactly 1080x1920 30fps, strip audio."""
    out_paths = []

    for i, clip in enumerate(clip_paths):
        out = str(Path(work_dir) / f"norm_{i:02d}.mp4")
        cmd = [
            "ffmpeg", "-y", "-i", clip,
            "-vf", (
                f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=increase,"
                f"crop={TARGET_W}:{TARGET_H},"
                f"setsar=1,"
                f"fps={FPS}"
            ),
            "-an",                        # strip original audio
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            out,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            print(f"  Warning: normalize clip {i} failed: {result.stderr[-500:]}")
            # Use original as fallback
            out_paths.append(clip)
        else:
            out_paths.append(out)

    return out_paths


def _concat_clips(clip_paths: list[str], output: str) -> None:
    """Concatenate clips using concat demuxer."""
    list_file = output.replace(".mp4", "_list.txt")
    with open(list_file, "w") as f:
        for p in clip_paths:
            f.write(f"file '{p}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list_file,
        "-c", "copy",
        output,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"Concat failed: {result.stderr[-1000:]}")


def _final_encode(
    video_path: str,
    audio_path: str,
    ass_path: str,
    output_path: str,
    audio_duration: float,
    bg_music_path: str | None,
) -> None:
    """Mix audio, loop background music, burn captions."""

    # Escape ass path for FFmpeg filter (Windows/Linux safe)
    ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")

    if bg_music_path and Path(bg_music_path).exists():
        # With background music
        filter_complex = (
            "[1:a]volume=1.0[tts];"
            f"[2:a]volume=0.12,aloop=loop=-1:size=2000000000[music];"
            "[tts][music]amix=inputs=2:duration=first:dropout_transition=2[aout];"
            f"[0:v]scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=decrease,"
            f"pad={TARGET_W}:{TARGET_H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,"
            f"ass='{ass_escaped}'[vout]"
        )
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-i", bg_music_path,
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            "-map", "[aout]",
        ]
    else:
        # TTS only
        filter_complex = (
            "[1:a]volume=1.0[aout];"
            f"[0:v]scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=decrease,"
            f"pad={TARGET_W}:{TARGET_H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,"
            f"ass='{ass_escaped}'[vout]"
        )
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            "-map", "[aout]",
        ]

    cmd += [
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-r", str(FPS),
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", str(audio_duration),
        "-movflags", "+faststart",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"Final encode failed: {result.stderr[-2000:]}")


# ── ASS Caption builder ──────────────────────────────────────────────────────

def _write_ass_captions(
    word_timestamps: list[dict],
    total_duration: float,
    output_path: str,
) -> None:
    """
    Write TikTok-style ASS subtitle file.

    Groups words into chunks of CAPTION_WORDS_PER_LINE.
    Alternates white/yellow for visual variety.
    """
    if not word_timestamps:
        # Write empty ASS file
        _write_ass_header(output_path)
        return

    # Group into chunks
    chunks = []
    for i in range(0, len(word_timestamps), CAPTION_WORDS_PER_LINE):
        group = word_timestamps[i : i + CAPTION_WORDS_PER_LINE]
        chunks.append({
            "text": " ".join(w["word"] for w in group),
            "start": group[0]["start"],
            "end": group[-1]["end"],
        })

    # Tighten gaps: end of one chunk = start of next (no blank frames)
    for i in range(len(chunks) - 1):
        chunks[i]["end"] = chunks[i + 1]["start"]

    lines = [_ass_header()]

    for i, chunk in enumerate(chunks):
        # Alternate white (#FFFFFF) and yellow (#FFE135) for engagement
        color_tag = r"{\c&H00FFFFFF&}" if i % 2 == 0 else r"{\c&H35E1FF&}"
        # (ASS uses BGR: &HBBGGRR& — so yellow #FFE135 = &H35E1FF&)

        start = _ass_time(chunk["start"])
        end = _ass_time(chunk["end"])
        text = chunk["text"].upper()  # uppercase = more impact

        lines.append(
            f"Dialogue: 0,{start},{end},Default,,0,0,0,,{color_tag}{text}"
        )

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def _ass_header() -> str:
    return f"""[Script Info]
ScriptType: v4.00+
PlayResX: {TARGET_W}
PlayResY: {TARGET_H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, Strikeout, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{CAPTION_FONT},{CAPTION_SIZE},&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,1,0,1,6,2,2,80,80,{CAPTION_MARGIN_V},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"""


def _write_ass_header(path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(_ass_header())


def _ass_time(seconds: float) -> str:
    """Convert float seconds to ASS time format H:MM:SS.cc"""
    seconds = max(0.0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


# ── Utility ──────────────────────────────────────────────────────────────────

def _probe_duration(path: str) -> float:
    """Get exact duration via ffprobe."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format", path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr}")
    return float(json.loads(result.stdout)["format"]["duration"])
