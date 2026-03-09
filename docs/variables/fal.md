# fal.ai — FAL_KEY

fal.ai is the API platform used to run Kling 2.5 Pro — the AI model that generates cinematic 9:16 video clips for each segment of the script.

**Cost:** ~$0.29 per 10-second clip. A typical video uses 6–9 clips = ~$1.74–$2.61 per video.

---

## Step 1 — Create an account

1. Go to [fal.ai](https://fal.ai)
2. Click **Sign Up** — use GitHub or Google
3. Verify your email

---

## Step 2 — Add billing

fal.ai is pay-as-you-go. You need to add credits before generating videos.

1. Go to [fal.ai/dashboard/billing](https://fal.ai/dashboard/billing)
2. Click **Add credits**
3. Add a payment method and purchase credits
   - Recommended starting amount: $20 (covers ~7 videos)
4. Enable **Auto-recharge** to avoid pipeline failures mid-run:
   - Set threshold: $5 remaining
   - Recharge amount: $20

---

## Step 3 — Create an API key

1. Go to [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
2. Click **Add key**
3. Name it `short-publisher`
4. Copy the key — format: `xxxxxxxx-xxxx-xxxx-xxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

> The key is shown only once. Save it immediately.

**Add to dashboard:** Dashboard → Secrets → **fal.ai API Key**

---

## Model used

```
fal-ai/kling-video/v2.5/pro/text-to-video
```

**Kling 2.5 Pro** is the state-of-the-art AI video generation model as of 2026:
- Generates 9:16 vertical video (native Shorts format)
- 10-second clips at 720p or 1080p
- Highly cinematic with natural motion
- ~$0.29/clip

### Other Kling models available on fal.ai

| Model | Quality | Cost | Notes |
|---|---|---|---|
| `kling-video/v2.5/pro` | Best | $0.29/clip | **Used by pipeline** |
| `kling-video/v2.5/standard` | Good | $0.10/clip | Lower quality |
| `kling-video/v1.6/pro` | Good | $0.20/clip | Older model |

To switch models, edit `generate_video_clips.py`:
```python
result = fal_client.subscribe("fal-ai/kling-video/v2.5/standard/text-to-video", ...)
```

---

## How the pipeline uses it

The pipeline generates clips **in parallel** using Python's `ThreadPoolExecutor` with 4 workers. For a 9-segment video:
- Sequential: ~90 seconds (10s × 9 clips)
- Parallel (4 workers): ~30 seconds

Each clip takes the `visual_prompt` from the Claude script and generates a 10-second, 9:16, cinematic video clip.

---

## Troubleshooting

**"insufficient_credits"** — add more credits or enable auto-recharge.

**Clip generation timeout** — Kling can take up to 60 seconds per clip under load. The pipeline has a 300-second timeout. If it times out, reduce the number of segments in the script (edit `generate_script.py` system prompt: "Aim for 5-6 segments").

**Low quality clips** — improve your visual prompts. The Kling model responds well to:
- Specific camera movements ("slow push-in on", "aerial tracking shot")
- Detailed lighting descriptions ("golden hour", "neon reflections")
- Motion in the scene ("smoke rising", "crowds moving", "water flowing")

**"model not found"** — verify the model ID. fal.ai updates model names occasionally. Check [fal.ai/models](https://fal.ai/models) for current names.
