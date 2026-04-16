# Short Publisher — External Services Reference

> Every external service used by the app, what it's used for, where to sign up, and what the costs look like.

---

## Required Services (pipeline will not work without these)

### 1. Anthropic (Claude)
| | |
|---|---|
| **Used for** | Generating video scripts — hook-first viral format, visual prompts per segment |
| **Model** | `claude-sonnet-4-6` |
| **Sign up** | [console.anthropic.com](https://console.anthropic.com) |
| **Key needed** | `ANTHROPIC_API_KEY` |
| **Cost** | ~$0.003–0.008 per script (very cheap) |
| **Free tier** | No free tier. Requires adding a credit card. $5 minimum top-up. |
| **Notes** | Input/output token costs are logged in the dashboard per video. |

---

### 2. ElevenLabs
| | |
|---|---|
| **Used for** | Premium text-to-speech voiceover with word-level timestamps (used for captions) |
| **Sign up** | [elevenlabs.io](https://elevenlabs.io) |
| **Keys needed** | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| **Cost** | ~$0.30–0.50 per video (depends on script length) |
| **Free tier** | 10,000 characters/month free (~2–3 videos) |
| **Paid plans** | Starter $5/month = 30,000 chars. Creator $22/month = 100,000 chars. |
| **Finding a Voice ID** | Log in → Voices → click any voice → the ID is in the browser URL: `.../voice/{VOICE_ID}` |
| **Notes** | Do not use OpenAI TTS — ElevenLabs timestamps are required for captions to work. |

---

### 3. fal.ai (Kling 2.6 Pro video generation)
| | |
|---|---|
| **Used for** | Generating cinematic 9:16 video clips from text prompts (Kling 2.6 Pro model) |
| **Sign up** | [fal.ai](https://fal.ai) |
| **Key needed** | `FAL_KEY` |
| **Cost** | **$1.40 per clip** (Kling 2.6 Pro bills 20s minimum per generation regardless of clip length). Default 3 clips = $4.20 |
| **Free tier** | $2 free credit on signup |
| **Notes** | This is the dominant cost per video. Reduce `max_clips` in Settings to lower cost. Up to 4 clips are generated in parallel. |

---

### 4. NeonDB
| | |
|---|---|
| **Used for** | Database — stores topics queue, video history, all settings and secrets |
| **Sign up** | [neon.tech](https://neon.tech) |
| **Key needed** | `DATABASE_URL` (Vercel env var — not the dashboard) |
| **Cost** | Free tier is sufficient for this app |
| **Free tier** | 0.5 GB storage, 1 project, unlimited requests |
| **Notes** | Connection string must include `?sslmode=require`. Schema lives in `shortgen` (not `public`). |

---

### 5. Cloudflare R2
| | |
|---|---|
| **Used for** | Storing the final assembled `.mp4` files |
| **Sign up** | [cloudflare.com](https://cloudflare.com) — R2 is under your account |
| **Keys needed** | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| **Cost** | Free for the first 10 GB/month storage, first 1M Class A operations/month |
| **Notes** | Files are stored at path `videos/{topic_id}/{timestamp}.mp4`. Enable public bucket access so the dashboard can show file URLs. |

---

### 6. YouTube Data API v3 (Google Cloud)
| | |
|---|---|
| **Used for** | Uploading the final video to YouTube as a Short |
| **Sign up** | [console.cloud.google.com](https://console.cloud.google.com) |
| **Keys needed** | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` |
| **Cost** | Free (YouTube API has a quota system, not a billing system) |
| **Daily quota** | 10,000 units/day. One video upload = ~1,600 units. So ~6 uploads/day free. |
| **Important** | The refresh token must be obtained via the `scripts/get_youtube_token.py` helper. It does not expire unless you revoke it. |
| **Notes** | The app uploads with `made_for_kids=false` by default. Change in Settings if needed. |

---

### 7. GitHub Actions
| | |
|---|---|
| **Used for** | Running the video generation pipeline on a schedule (cron) and on-demand |
| **Sign up** | Already on GitHub (you need a GitHub account to fork the repo) |
| **Keys needed** | GitHub repo secrets: `APP_URL`, `PIPELINE_SECRET_KEY` |
| **Cost** | Free tier: 2,000 minutes/month on public repos, 500 minutes on private repos |
| **Pipeline runtime** | ~8 minutes per run. Free tier supports ~250 runs/month (public repo) or ~60 runs/month (private) |
| **Notes** | The workflow file is at `.github/workflows/publish.yml`. Cron is `0 9 * * *` (09:00 UTC daily). |

---

## Optional Services

### 8. Telegram Bot
| | |
|---|---|
| **Used for** | Push notifications when a video is published or the pipeline fails |
| **Sign up** | Create a bot via [@BotFather](https://t.me/BotFather) on Telegram |
| **Keys needed** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| **Cost** | Free |
| **Setup** | 1. `/newbot` in BotFather → get token. 2. Start a chat with the bot. 3. Visit `https://api.telegram.org/bot{TOKEN}/getUpdates` to find your `chat_id`. |

---

### 9. Resend (Email notifications)
| | |
|---|---|
| **Used for** | Email alerts on pipeline success, failure, or daily digest |
| **Sign up** | [resend.com](https://resend.com) |
| **Keys needed** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL` |
| **Cost** | Free: 3,000 emails/month |
| **Notes** | `RESEND_FROM_EMAIL` must be a verified domain or the default Resend test address. |

---

## Cost Per Video — Summary

| Service | Cost per video | Notes |
|---------|---------------|-------|
| Kling 2.6 Pro (fal.ai) | ~$4.20 | 3 clips × $1.40 (dominant cost) |
| ElevenLabs | ~$0.30–0.50 | Depends on script length |
| Claude | ~$0.005–0.01 | Very cheap |
| R2 storage | ~$0.001 | Negligible |
| **Total** | **~$4.50–5.00** | Per published Short |

Reduce `max_clips` to `1` or `2` in Settings to cut costs:
- 1 clip: ~$1.80 total
- 2 clips: ~$3.20 total
- 3 clips: ~$4.60 total (recommended quality)

---

## Account Quotas to Watch

| Service | Limit | What happens if exceeded |
|---------|-------|------------------------|
| YouTube API | 10,000 units/day | Upload fails with quota error |
| GitHub Actions (private repo) | 500 min/month | Workflow stops running |
| ElevenLabs free tier | 10,000 chars/month | Audio generation fails |
| NeonDB free tier | 0.5 GB | DB writes start failing |

All of these are generous enough that a single user running 1 video/day will never hit them.
