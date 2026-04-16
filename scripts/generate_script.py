"""
generate_script.py

Generates a hook-first viral YouTube Shorts script using Claude claude-sonnet-4-6.

Output includes:
- title, description, hashtags
- full spoken script
- segments: each with spoken text + Kling 2.5 visual prompt

Target: 160-220 words = 60-90s at natural speaking pace.
"""

import os
import json
import anthropic

SYSTEM_PROMPT = """You are the world's best YouTube Shorts scriptwriter. You've studied every viral short since TikTok's launch. You know exactly what makes a person's thumb stop mid-scroll.

You understand the algorithm is brutal:
- The brain decides to scroll or stay in 1.5 seconds
- Every 8-10 seconds without a new hook = dropout
- Short fragments hit harder than long sentences
- The last 5 seconds determine if they follow

SCRIPT RULES — never break these:
1. First sentence: pattern interrupt. Use ONE of:
   - Shocking stat: "99% of people have no idea..."
   - Direct threat/FOMO: "You're losing [X] every day and don't know it."
   - Controversy: "Everything you know about [X] is wrong."
   - Curiosity gap: "The one thing nobody tells you about [X]..."
   - Challenge: "Stop doing [X]. Here's what actually works."
2. NEVER begin with: "I", "In this video", "Today", "Hey guys", "Welcome"
3. Max 10 words per sentence. Fragments preferred.
4. Re-hook every 8-10 seconds — new fact, twist, or revelation
5. Speak to "you" directly — never "people" or "they"
6. Final 3 seconds: one punchy CTA. Never beg. Make it feel inevitable.
7. Word count: 160-220 words

VISUAL PROMPT RULES for Kling 2.5 (cinematic AI video generator):
- Lead with camera movement: "Slow push-in on...", "Aerial tracking shot of...", "Extreme close-up of...", "Low-angle upward shot of..."
- Be specific about lighting: "harsh tungsten backlighting", "golden hour rays through fog", "neon reflections on wet asphalt"
- Describe what fills the 9:16 vertical frame top to bottom
- Include motion: something must move — particles, smoke, water, light, crowds
- No human faces unless the niche demands it
- Photorealistic, cinematic grade

Return ONLY valid JSON — no markdown, no code fences, nothing else:
{
  "title": "Curiosity-driven YouTube title, under 70 characters, no clickbait clichés",
  "description": "3 sentences: hook + value delivered + CTA. Include 3 relevant hashtags inline.",
  "hashtags": ["Shorts", "niche_tag", ...],
  "script": "Full spoken script as one continuous string",
  "segments": [
    {
      "text": "The exact words spoken during this segment",
      "visual_prompt": "Kling 2.5 cinematic prompt for this 10-second visual"
    }
  ]
}

Number of segments = floor(target_duration / 10). Strictly follow the segment count in the user prompt. Each segment = exactly 10 seconds of speech."""


TONE_INSTRUCTIONS = {
    "educational": "Teach something surprising. Facts must be accurate. Frame as 'things they don't teach you'.",
    "entertaining": "Entertain first, inform second. Use humor, absurdity, or storytelling. Hook = unexpected scenario.",
    "motivational": "Fire them up. Short punchy affirmations. Real stakes. 'You can do this' energy but no cringe.",
    "news": "Breaking news energy. Urgent, present tense. 'This just changed everything about [X].'",
}


def generate_script(
    topic_title: str,
    topic_description: str | None,
    niche: str | None,
    keywords: list[str],
    tone: str = "educational",
    duration_target: int = 30,
    max_segments: int | None = None,
) -> dict:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    tone_note = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["educational"])
    word_target = int(duration_target * 2.7)  # ~2.7 words/second at natural pace
    segments_target = max_segments or max(1, round(duration_target / 10))

    user_prompt = f"""Topic: {topic_title}
Niche: {niche or "general"}
Tone: {tone} — {tone_note}
Keywords: {", ".join(keywords) if keywords else "none"}
Context: {topic_description or "none"}
Target duration: {duration_target}s (~{word_target} words)
Segments: exactly {segments_target} (one per 10-second clip — do not produce more or fewer)

Write the script now. Return only valid JSON."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if Claude added them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    result = json.loads(raw)

    for key in ("title", "description", "hashtags", "script", "segments"):
        if key not in result:
            raise ValueError(f"Script missing required field: {key}")

    if not result["segments"]:
        raise ValueError("Script produced no segments")

    # Claude Sonnet 4.6: $3/MTok input, $15/MTok output
    input_tokens = message.usage.input_tokens
    output_tokens = message.usage.output_tokens
    claude_cost = (input_tokens * 3 + output_tokens * 15) / 1_000_000

    print(f"  Title    : {result['title']}")
    print(f"  Segments : {len(result['segments'])}")
    print(f"  Words    : {len(result['script'].split())}")
    print(f"  Tokens   : {input_tokens} in / {output_tokens} out (${claude_cost:.4f})")

    result["_usage"] = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "claude_cost_usd": round(claude_cost, 6),
    }
    return result
