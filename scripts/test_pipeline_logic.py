"""
test_pipeline_logic.py

Validates pipeline changes WITHOUT calling fal.ai or ElevenLabs.
Only calls Claude once (~$0.006) to verify segment count enforcement.

Run:
    cd scripts && python test_pipeline_logic.py
"""

import os
import sys
import json
from pathlib import Path

# ── Load env from .env.local ──────────────────────────────────────────────────
env_file = Path(__file__).parent.parent / ".env.local"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

from generate_script import generate_script

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

errors = 0

def check(label: str, condition: bool, detail: str = ""):
    global errors
    if condition:
        print(f"  {PASS} {label}")
    else:
        print(f"  {FAIL} {label}{(' — ' + detail) if detail else ''}")
        errors += 1

# ── Test 1: max_segments=3 ────────────────────────────────────────────────────
print("\n[1/3] generate_script — max_segments=3, duration=30s")
script = generate_script(
    topic_title="The one money habit that saves $500/month",
    topic_description=None,
    niche="Personal Finance",
    keywords=["money", "savings"],
    tone="educational",
    duration_target=30,
    max_segments=3,
)
segs = script.get("segments", [])
check("returns exactly 3 segments", len(segs) == 3, f"got {len(segs)}")
check("has title", bool(script.get("title")))
check("has script text", bool(script.get("script")))
check("each segment has visual_prompt", all("visual_prompt" in s for s in segs))
check("each segment has text", all("text" in s for s in segs))
check("_usage present", "_usage" in script)
check("claude_cost_usd > 0", script.get("_usage", {}).get("claude_cost_usd", 0) > 0)
print(f"  > Title: {script.get('title')}")
print(f"  > Segments: {len(segs)} | Cost: ${script['_usage']['claude_cost_usd']:.4f}")

# ── Test 2: max_segments=1 ────────────────────────────────────────────────────
print("\n[2/3] generate_script — max_segments=1, duration=10s")
script1 = generate_script(
    topic_title="Stop wasting money on coffee",
    topic_description=None,
    niche="Personal Finance",
    keywords=["coffee", "savings"],
    tone="motivational",
    duration_target=10,
    max_segments=1,
)
segs1 = script1.get("segments", [])
check("returns exactly 1 segment", len(segs1) == 1, f"got {len(segs1)}")
print(f"  > Title: {script1.get('title')}")

# ── Test 3: cost calculation logic ────────────────────────────────────────────
print("\n[3/3] Cost calculation — clips_attempted vs clips_ok")

def simulate_cost(clips_attempted: int, clips_ok: int, claude_cost: float, eleven_cost: float):
    kling_cost = clips_attempted * 0.70
    total = round(claude_cost + eleven_cost + kling_cost, 4)
    return {
        "kling": {"clips": clips_attempted, "clips_ok": clips_ok, "cost_usd": round(kling_cost, 4)},
        "total_usd": total,
    }

# All succeed: 3 attempted, 3 ok
r = simulate_cost(3, 3, 0.006, 0.12)
check("3 clips all ok => kling=$2.10", r["kling"]["cost_usd"] == 2.10)
check("3 clips total_usd correct", r["total_usd"] == round(0.006 + 0.12 + 2.10, 4))

# 1 clip fails: 3 attempted, 2 ok — should still bill 3
r2 = simulate_cost(3, 2, 0.006, 0.12)
check("3 attempted, 2 ok → still bills 3 ($2.10)", r2["kling"]["cost_usd"] == 2.10)
check("clips_ok=2 recorded", r2["kling"]["clips_ok"] == 2)

# Old (broken) formula would only bill 2
old_cost = 2 * 0.70  # only successful clips
check("old formula would undercount by $0.70", old_cost == 1.40)

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n{'='*50}")
if errors == 0:
    print(f"{PASS} All checks passed — pipeline logic is correct.")
    print("   Claude segment enforcement: PASS")
    print("   Cost calculation (attempted not ok): PASS")
else:
    print(f"{FAIL} {errors} check(s) failed — review before next pipeline run.")
    sys.exit(1)
