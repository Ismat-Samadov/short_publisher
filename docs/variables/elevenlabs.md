# ElevenLabs — ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID

ElevenLabs generates the premium AI voiceover. It also returns word-level timestamps used to create the TikTok-style burned-in captions.

**Cost:** ~$0.10 per video (1,000 characters ≈ 60 seconds of speech).

---

## ELEVENLABS_API_KEY

### Step 1 — Create an account

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Click **Sign Up** — use Google or email
3. Verify your email

### Step 2 — Choose a plan

The free tier gives 10,000 characters/month. Each video script is ~800–1,200 characters, so you get ~8–12 free videos.

For daily publishing, you need the **Creator plan** ($22/month) or higher:
- 100,000 characters/month = ~80–100 videos

1. Go to **Settings** → **Subscription**
2. Click **Upgrade** → **Creator**

### Step 3 — Get the API key

1. Go to **Settings** → **API Keys** (in the left sidebar)
   - Or click your profile icon → **Profile + API Key**
2. Under **API Key**, click the copy icon
3. The key starts with `sk_`

**Add to dashboard:** Dashboard → Secrets → **ElevenLabs API Key**

---

## ELEVENLABS_VOICE_ID

The voice ID determines which AI voice narrates your videos. This is the most important creative choice.

### Find voices in the Voice Library

1. Go to [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library)
2. Filter by:
   - **Language:** English
   - **Use case:** Narration / Social Media
   - **Gender:** your preference
3. Click **Preview** to hear a sample
4. Click **Add to My Voices** on a voice you like

### Get the Voice ID

**Method 1 — From the Voice Library:**
1. After adding a voice, go to **Voices** in the left sidebar
2. Click the voice
3. The URL contains the ID: `elevenlabs.io/app/voice-lab/edit/VOICE_ID_HERE`
4. Or click the **ID** field shown on the voice detail page

**Method 2 — From the API:**
```bash
curl -H "xi-api-key: YOUR_API_KEY" https://api.elevenlabs.io/v1/voices | python3 -m json.tool | grep -A2 "name"
```

### Recommended voices for YouTube Shorts (2026)

| Voice | Style | Best for |
|---|---|---|
| Adam (`pNInz6obpgDQGcFmaJgB`) | Deep, authoritative | Tech, finance, news |
| Rachel (`21m00Tcm4TlvDq8ikWAM`) | Clear, professional | Education, how-to |
| Antoni (`ErXwobaYiN019PkySvjV`) | Confident, engaging | Motivation, lifestyle |
| Josh (`TxGEqnHWrfWFTfGW9XjX`) | Casual, friendly | Entertainment, pop culture |
| Domi (`AZnzlk1XvdvUeBnXmlld`) | Energetic, young | Trends, lifestyle |

**Add to dashboard:** Dashboard → Secrets → **ElevenLabs Voice ID**

---

## Model used

The pipeline uses `eleven_multilingual_v2` — ElevenLabs' highest quality model. It produces the most natural prosody and the most accurate timestamps for captions.

---

## Troubleshooting

**"quota_exceeded"** — you've used all your monthly characters. Upgrade your plan or wait for the next billing cycle.

**"voice_not_found"** — the Voice ID is wrong or the voice hasn't been added to your account. Go to the Voice Library and add it.

**Robotic/flat audio** — try a different voice. Some voices work better for specific content niches.

**Captions out of sync** — this is a timestamp alignment issue in `assemble_video.py`. The `with-timestamps` endpoint returns character-level timing; ensure the word grouping in `generate_audio.py` is correct.
