# Environment Variables — Where Each One Goes

Variables live in **3 different places**. This is the single source of truth for what goes where.

---

## Place 1 — Vercel Environment Variables

> Vercel dashboard → your project → **Settings → Environment Variables**

These 4 are required before the first deploy. The app cannot start without them.

| Variable | How to generate | Description |
|---|---|---|
| `DATABASE_URL` | From NeonDB → Connection Details | PostgreSQL connection string — must end in `?sslmode=require` |
| `PIPELINE_SECRET_KEY` | `openssl rand -hex 16` | Shared secret — GitHub Actions sends this to authenticate API calls |
| `DASHBOARD_PASSWORD` | Choose any strong password | Password to log into `/dashboard` |
| `AUTH_TOKEN` | `openssl rand -hex 32` | Signs the session cookie — changing this logs everyone out |

> After changing any Vercel env var, go to **Deployments → three dots → Redeploy** for it to take effect.

---

## Place 2 — GitHub Actions Secrets

> Your repo on GitHub → **Settings → Secrets and variables → Actions → New repository secret**

These 2 secrets are the **only** ones GitHub Actions needs. All API keys are loaded from the app database at runtime.

| Secret Name | Value |
|---|---|
| `APP_URL` | Your Vercel production URL — e.g. `https://short-publisher-xyz.vercel.app` (no trailing slash) |
| `PIPELINE_SECRET_KEY` | **Exact same value** as the one set in Vercel env vars above |

> `PIPELINE_SECRET_KEY` must be identical in both Vercel and GitHub. If they differ, the pipeline will get 401 errors on every API call.

---

## Place 3 — App Secrets (Dashboard → Secrets page)

> Open your deployed app → **`/dashboard/secrets`** → log in → enter each key

These are stored in NeonDB and fetched by the pipeline automatically at runtime. Do **not** add them to Vercel or GitHub.

### AI Services (required for pipeline to run)

| Variable | Where to get it | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys | Generates video scripts via Claude claude-sonnet-4-6 |
| `ELEVENLABS_API_KEY` | ElevenLabs → Profile → API Keys | Text-to-speech voiceover |
| `ELEVENLABS_VOICE_ID` | ElevenLabs → Voices → click voice → copy ID from URL | Which voice to use |
| `FAL_KEY` | [fal.ai](https://fal.ai) → Dashboard → API Keys | Kling 2.6 Pro video clip generation |

### Cloudflare R2 (required — stores the final .mp4 files)

| Variable | Value |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → top-right corner |
| `R2_ACCESS_KEY_ID` | From R2 API token (Object Read & Write) |
| `R2_SECRET_ACCESS_KEY` | From R2 API token — only shown once at creation |
| `R2_BUCKET_NAME` | Exact bucket name, e.g. `short-publisher-videos` |
| `R2_PUBLIC_URL` | Public bucket CDN URL, e.g. `https://pub-xxx.r2.dev` |

### YouTube (required for publishing)

| Variable | Value |
|---|---|
| `YOUTUBE_CLIENT_ID` | Google Cloud → APIs & Services → Credentials → OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | Same OAuth credential (starts with `GOCSPX-`) |
| `YOUTUBE_REFRESH_TOKEN` | Run `python scripts/get_youtube_token.py` — auto-written to `.env.local` |

See [youtube.md](./youtube.md) for the full OAuth setup walkthrough.

### GitHub Integration (required for Dashboard → Pipeline page)

| Variable | Value |
|---|---|
| `GH_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens (classic) — scopes: `repo`, `workflow` |
| `GH_REPO` | `username/repo-name` — no `https://`, no `.git` |
| `GH_WORKFLOW_FILE` | `publish.yml` |

### Telegram Notifications (optional)

| Variable | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy token |
| `TELEGRAM_CHAT_ID` | Start chat with your bot → visit `https://api.telegram.org/bot{TOKEN}/getUpdates` → copy `chat.id` |

### Email Notifications via Resend (optional)

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | A verified sender address in Resend |
| `CONTACT_NOTIFICATION_EMAIL` | Where to receive pipeline alerts |

### Other (optional)

| Variable | Value |
|---|---|
| `APP_URL` | Your Vercel URL — also store here so email/Telegram templates can link back to the dashboard |
| `BACKGROUND_MUSIC_URL` | Direct URL to an MP3 file, played at 12% volume under voiceover |

---

## Summary — where does each variable live?

| Variable | Vercel | GitHub Actions | Dashboard (/dashboard/secrets) |
|---|:---:|:---:|:---:|
| `DATABASE_URL` | ✅ | — | — |
| `PIPELINE_SECRET_KEY` | ✅ | ✅ (same value) | — |
| `DASHBOARD_PASSWORD` | ✅ | — | — |
| `AUTH_TOKEN` | ✅ | — | — |
| `APP_URL` | — | ✅ | ✅ (optional, for templates) |
| `ANTHROPIC_API_KEY` | — | — | ✅ |
| `ELEVENLABS_API_KEY` | — | — | ✅ |
| `ELEVENLABS_VOICE_ID` | — | — | ✅ |
| `FAL_KEY` | — | — | ✅ |
| `R2_ACCOUNT_ID` | — | — | ✅ |
| `R2_ACCESS_KEY_ID` | — | — | ✅ |
| `R2_SECRET_ACCESS_KEY` | — | — | ✅ |
| `R2_BUCKET_NAME` | — | — | ✅ |
| `R2_PUBLIC_URL` | — | — | ✅ |
| `YOUTUBE_CLIENT_ID` | — | — | ✅ |
| `YOUTUBE_CLIENT_SECRET` | — | — | ✅ |
| `YOUTUBE_REFRESH_TOKEN` | — | — | ✅ |
| `GH_TOKEN` | — | — | ✅ |
| `GH_REPO` | — | — | ✅ |
| `GH_WORKFLOW_FILE` | — | — | ✅ |
| `TELEGRAM_BOT_TOKEN` | — | — | ✅ (optional) |
| `TELEGRAM_CHAT_ID` | — | — | ✅ (optional) |
| `RESEND_API_KEY` | — | — | ✅ (optional) |
| `RESEND_FROM_EMAIL` | — | — | ✅ (optional) |
| `CONTACT_NOTIFICATION_EMAIL` | — | — | ✅ (optional) |
| `BACKGROUND_MUSIC_URL` | — | — | ✅ (optional) |

---

## Setup order

1. [neondb.md](./neondb.md) — create database, get `DATABASE_URL`
2. [bootstrap.md](./bootstrap.md) — set Vercel env vars, deploy, add GitHub secrets
3. [anthropic.md](./anthropic.md) — `ANTHROPIC_API_KEY`
4. [elevenlabs.md](./elevenlabs.md) — `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`
5. [fal.md](./fal.md) — `FAL_KEY`
6. [cloudflare-r2.md](./cloudflare-r2.md) — all `R2_*` variables
7. [youtube.md](./youtube.md) — OAuth setup + `YOUTUBE_*` variables
8. [github.md](./github.md) — `GH_TOKEN`, `GH_REPO`, `GH_WORKFLOW_FILE`
9. [telegram.md](./telegram.md) — optional notifications
10. [resend.md](./resend.md) — optional email alerts

---

## YouTube OAuth scope note

The refresh token must include **both** scopes:
- `https://www.googleapis.com/auth/youtube.upload` — to publish videos
- `https://www.googleapis.com/auth/youtube.readonly` — to sync engagement stats

`scripts/get_youtube_token.py` requests both automatically. If you have an old token with only `upload` scope, revoke it at [myaccount.google.com/permissions](https://myaccount.google.com/permissions) and re-run the script.
