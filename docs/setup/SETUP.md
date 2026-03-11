# Short Publisher — Complete Setup Guide

> Full installation from zero to first published YouTube Short. Follow every section in order. Total time: ~60–90 minutes.

---

## Prerequisites

Before you start, make sure you have:

- [ ] A **GitHub** account
- [ ] A **Vercel** account (free tier is fine)
- [ ] A **NeonDB** account (free tier is fine)
- [ ] A **Cloudflare** account (for R2 storage)
- [ ] A **Google account** with a YouTube channel already created
- [ ] An **Anthropic** account (Claude API)
- [ ] An **ElevenLabs** account
- [ ] A **fal.ai** account (for Kling video generation)
- [ ] **Python 3.11+** installed locally (only needed once, for the YouTube token step)
- [ ] **Node.js 18+** installed locally

---

## Step 1 — Fork & Clone the Repository

1. Fork the repo to your own GitHub account (this is required — GitHub Actions runs on your fork).
2. Clone it locally:

```bash
git clone https://github.com/YOUR_USERNAME/short-publisher.git
cd short-publisher
```

3. Install dependencies:

```bash
npm install
```

---

## Step 2 — Set Up NeonDB

The app uses NeonDB (serverless Postgres) as its database.

1. Go to [neon.tech](https://neon.tech) and create a new project.
2. Name it anything (e.g. `short-publisher`).
3. Once created, click **Connection Details** and copy the **connection string**. It looks like:
   ```
   postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this string — you'll need it in Step 4.

### Push the database schema

Create a `.env.local` file in the project root:

```bash
DATABASE_URL=postgresql://your-connection-string-here
```

Then run:

```bash
npm run db:push
```

This creates all tables (`topics`, `videos`, `settings`) inside a `shortgen` schema in your NeonDB. You should see output confirming the tables were created. If you see errors, double-check the `DATABASE_URL`.

---

## Step 3 — Set Up Cloudflare R2

R2 stores all generated video files.

1. Go to your [Cloudflare dashboard](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**.
2. Name the bucket (e.g. `short-publisher-videos`). Leave all other settings as default.
3. After creating the bucket, go to **Settings** → **Public access** → enable **Allow public access** (this lets the dashboard display presigned URLs).
4. Copy your **Account ID** from the top-right of the Cloudflare dashboard.

### Create R2 API credentials

1. In Cloudflare dashboard → R2 → **Manage R2 API tokens** → **Create API token**.
2. Set permissions to **Object Read & Write**.
3. Scope it to your specific bucket.
4. Copy and save:
   - `Access Key ID`
   - `Secret Access Key`

### Get the public URL

1. In your bucket → **Settings** → **Public Access** → copy the public bucket URL. It looks like:
   ```
   https://pub-xxxxxxxxxxxx.r2.dev
   ```

You'll enter all of these in the dashboard secrets later (Step 7).

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your forked GitHub repo.
2. Vercel will auto-detect it as a Next.js project. Do **not** change the framework settings.
3. Before clicking Deploy, go to **Environment Variables** and add these **4 variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your NeonDB connection string | From Step 2 |
| `PIPELINE_SECRET_KEY` | A random 32-character string | Run: `openssl rand -hex 16` |
| `DASHBOARD_PASSWORD` | Your chosen admin password | Pick something strong |
| `AUTH_TOKEN` | A random 64-char hex string | Run: `openssl rand -hex 32` |

4. Click **Deploy**. Wait for the build to finish (~2 minutes).
5. Copy your deployment URL (e.g. `https://short-publisher-xyz.vercel.app`). You'll need it for GitHub Actions.

> **Important:** Every time you change environment variables in Vercel, you must redeploy for them to take effect. Go to Deployments → click the three dots on the latest deployment → **Redeploy**.

---

## Step 5 — Configure GitHub Actions

The pipeline runs daily as a GitHub Actions workflow. It only needs 2 secrets.

1. In your forked GitHub repo, go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

2. Add these 2 secrets:

| Secret Name | Value |
|-------------|-------|
| `APP_URL` | Your Vercel URL from Step 4 (e.g. `https://short-publisher-xyz.vercel.app`) |
| `PIPELINE_SECRET_KEY` | The **same** value you used in Vercel env vars |

That's it. GitHub Actions needs nothing else — all other API keys are loaded from the dashboard database at runtime.

---

## Step 6 — Get Your YouTube Refresh Token

This is a one-time step to connect your YouTube channel. You need Python installed locally.

### Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (e.g. `short-publisher`).
3. Go to **APIs & Services** → **Enable APIs** → search for **YouTube Data API v3** → Enable it.
4. Go to **APIs & Services** → **OAuth consent screen**:
   - User type: **External**
   - Fill in app name, support email, developer email
   - Scopes: add `https://www.googleapis.com/auth/youtube.upload`
   - Test users: add your Gmail address
   - Save and continue through all steps
5. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Desktop app**
   - Name: anything
   - Click Create
   - Download the JSON (or copy `client_id` and `client_secret`)

### Run the token helper script

The script uses only Python stdlib — no extra packages needed. First, make sure your `.env.local` has:

```bash
YOUTUBE_CLIENT_ID=your-client-id
YOUTUBE_CLIENT_SECRET=your-client-secret
```

Then run:

```bash
cd scripts
python get_youtube_token.py
```

It will open a browser window. Log in with the Google account that owns your YouTube channel and grant permission. After completing the OAuth flow, the script automatically writes the token into your `.env.local`:

```
Done! YOUTUBE_REFRESH_TOKEN written to .env.local
```

Open `.env.local` and copy the `YOUTUBE_REFRESH_TOKEN` value. You'll enter it in the dashboard in the next step.

---

## Step 7 — Enter All API Keys in the Dashboard

Open your Vercel deployment URL, go to `/dashboard/secrets`, and log in with your `DASHBOARD_PASSWORD`.

Enter each key in the appropriate field:

### AI Services

| Key | Where to get it |
|-----|----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → Profile → API Keys |
| `ELEVENLABS_VOICE_ID` | ElevenLabs → Voices → click a voice → copy the ID from the URL |
| `FAL_KEY` | [fal.ai](https://fal.ai) → Dashboard → API Keys |

### Cloudflare R2

| Key | Value |
|-----|-------|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → top right corner |
| `R2_ACCESS_KEY_ID` | From Step 3 |
| `R2_SECRET_ACCESS_KEY` | From Step 3 |
| `R2_BUCKET_NAME` | The bucket name you chose (e.g. `short-publisher-videos`) |
| `R2_PUBLIC_URL` | The public bucket URL (e.g. `https://pub-xxx.r2.dev`) |

### YouTube

| Key | Value |
|-----|-------|
| `YOUTUBE_CLIENT_ID` | From your Google Cloud OAuth credentials |
| `YOUTUBE_CLIENT_SECRET` | From your Google Cloud OAuth credentials |
| `YOUTUBE_REFRESH_TOKEN` | The token you got in Step 6 |

### GitHub (for pipeline trigger/history in dashboard)

| Key | Value |
|-----|-------|
| `GH_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens (classic) → scope: `repo`, `workflow` |
| `GH_REPO` | Your forked repo in the format `username/short-publisher` |
| `GH_WORKFLOW_FILE` | `publish.yml` (exact filename, do not change) |

### Telegram (optional — for notifications)

1. Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → follow prompts → copy the **bot token**.
2. Start a chat with your new bot, then visit: `https://api.telegram.org/bot{YOUR_TOKEN}/getUpdates` to get your `chat_id`.

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | From BotFather |
| `TELEGRAM_CHAT_ID` | Your numeric chat ID |

### Email / Resend (optional)

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | A verified sender address in Resend |
| `CONTACT_NOTIFICATION_EMAIL` | Where to receive pipeline notifications |

### Background Music (optional)

| Key | Value |
|-----|-------|
| `BACKGROUND_MUSIC_URL` | A direct URL to a royalty-free MP3 file |

---

## Step 8 — Configure Pipeline Settings

Go to `/dashboard/settings` and configure:

| Setting | Recommended default | Notes |
|---------|-------------------|-------|
| Auto-publish enabled | On | Turn off to pause without touching GitHub |
| Default niche | `Technology` | Used when a topic has no niche |
| Target duration | `30` | Seconds. 30s = 3 clips at 10s each |
| Max Kling clips | `3` | 3 clips = ~$4.33 per video total |
| Script tone | `Educational` | Adjust to your content style |
| Burned-in captions | On | Strongly recommended for Shorts |
| YouTube visibility | `Public` | Or `Unlisted` to review before publishing |
| YouTube category | `28 — Science & Technology` | Pick what fits your niche |

---

## Step 9 — Add Your First Topics

Go to `/dashboard/topics` → **Add Topic**.

Fill in:
- **Title**: The video topic (e.g. "How black holes form")
- **Description**: Optional context for Claude's script generation
- **Niche**: e.g. `Space`, `Technology`, `Finance`
- **Keywords**: comma-separated tags
- **Priority**: higher number = picked first by the pipeline

Add 3–5 topics to start with a queue.

---

## Step 10 — Run the Pipeline

### Manual test run

Go to `/dashboard/pipeline` → click **Dry Run** first.

This triggers the full pipeline except the YouTube upload step. Watch GitHub Actions for the live log:

1. Go to your forked repo on GitHub → **Actions** tab
2. Click the latest run → click the `publish` job
3. Watch the live output — it should complete all steps and print a cost breakdown

If the dry run succeeds, click **Trigger Now** to do a real run that publishes to YouTube.

### Automatic schedule

The pipeline runs automatically every day at **09:00 UTC** via the cron in `.github/workflows/publish.yml`. No action required — just make sure your queue has topics.

---

## Step 11 — Verify Everything Works

After a successful run, check:

- [ ] `/dashboard/videos` shows the new video with status `published`
- [ ] The YouTube channel has the new Short
- [ ] The R2 bucket contains the `.mp4` file
- [ ] (If Telegram is configured) You received a notification

---

## Updating the App

To get the latest version:

```bash
git pull origin main
npm install
npm run db:push   # only needed if schema changed
```

Then redeploy on Vercel (push to main triggers automatic redeployment if Vercel is connected to your repo).

---

## Local Development

To run the dashboard locally:

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and the 3 auth vars in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To run the pipeline locally:

```bash
cd scripts
# Make sure all env vars are set (or loaded from the dashboard)
APP_URL=https://your-vercel-url.app \
PIPELINE_SECRET_KEY=your-key \
DRY_RUN=true \
python pipeline.py
```
