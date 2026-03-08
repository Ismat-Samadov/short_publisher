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

Aim for 6-9 segments. Each segment = ~10-15 seconds of speech."""


def generate_script(
    topic_title: str,
    topic_description: str | None,
    niche: str | None,
    keywords: list[str],
) -> dict:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    user_prompt = f"""Topic: {topic_title}
Niche: {niche or "general"}
Keywords: {", ".join(keywords) if keywords else "none"}
Context: {topic_description or "none"}

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

    print(f"  Title    : {result['title']}")
    print(f"  Segments : {len(result['segments'])}")
    print(f"  Words    : {len(result['script'].split())}")

    return result
