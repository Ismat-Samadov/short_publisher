# Short Publisher

Autonomous YouTube Shorts generation and publishing platform. Produces cinematic ~60 second Shorts daily using AI — from topic idea to published video with zero manual intervention.

Generated Shorts: https://www.youtube.com/@ismat-samadov

**Stack:** Next.js 16 · NeonDB · Cloudflare R2 · GitHub Actions · Claude Sonnet · ElevenLabs · Kling 2.6 Pro · FFmpeg · YouTube Data API v3

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ismat-Samadov/short_publisher&env=DATABASE_URL,PIPELINE_SECRET_KEY,DASHBOARD_PASSWORD,AUTH_TOKEN&envDescription=4%20bootstrap%20variables%20required%20to%20run%20the%20dashboard&envLink=https://github.com/Ismat-Samadov/short_publisher/blob/main/docs/variables/README.md)

---

## Architecture Overview

```mermaid
graph TB
    subgraph Dashboard["🖥️ Next.js Dashboard (Vercel)"]
        UI["Admin UI\n/dashboard/*"]
        API["API Routes\n/api/*"]
    end

    subgraph Pipeline["⚙️ Pipeline (GitHub Actions)"]
        GHA["Cron / Manual Trigger\n09:00 UTC daily"]
        PY["pipeline.py\nOrchestrator"]
    end

    subgraph AI["🤖 AI Services"]
        CLAUDE["Claude Sonnet 4.6\nScript Generation"]
        EL["ElevenLabs\nVoiceover + Timestamps"]
        KLING["Kling 2.6 Pro via fal.ai\nCinematic Video Clips ($0.07/s)"]
        FFMPEG["FFmpeg\nAssembly + Captions"]
    end

    subgraph Storage["💾 Storage"]
        DB[("NeonDB\nshortgen schema")]
        R2["Cloudflare R2\nVideo Archive"]
    end

    subgraph Publish["📤 Publish"]
        YT["YouTube Data API v3"]
        TG["Telegram Bot\nNotifications"]
        EM["Resend\nEmail Notifications"]
    end

    UI --> API
    API --> DB
    GHA -->|"workflow_dispatch / schedule"| PY
    PY -->|"GET /api/topics/next"| API
    PY --> CLAUDE
    PY --> EL
    PY --> KLING
    PY --> FFMPEG
    PY --> R2
    PY --> YT
    PY -->|"POST /api/videos/complete\n(with cost metadata)"| API
    API --> DB
    PY --> TG
    API --> EM
```

---

## Video Generation Pipeline

8 sequential steps, ~8 minutes total on GitHub Actions:

```
Step 1  Fetch Topic       NeonDB → pick next queued topic, mark processing
Step 2  Generate Script   Claude Sonnet 4.6 → hook-first script + visual prompts
Step 3  Voiceover         ElevenLabs → MP3 audio + word-level timestamps
Step 4  Video Clips       Kling 2.6 Pro (fal.ai) → cinematic 9:16 clips (parallel)
Step 5  Assemble          FFmpeg → normalize + concat + mix + burn captions
Step 6  Archive           Upload final.mp4 to Cloudflare R2
Step 7  Publish           YouTube Data API v3 → upload as Short
Step 8  Report            POST /api/videos/complete → save to DB + notify
```

---

## Dashboard Pages

| Page | URL | Description |
|---|---|---|
| Overview | `/dashboard` | Stats, recent videos, queue preview, quick actions |
| Topics | `/dashboard/topics` | Add / prioritize / reset video topics |
| Videos | `/dashboard/videos` | Full publish history with cost breakdown and engagement stats |
| Pipeline | `/dashboard/pipeline` | Trigger dry-run or live pipeline, view GitHub Actions history |
| Settings | `/dashboard/settings` | Schedule, content, voice, YouTube, notification toggles |
| Secrets | `/dashboard/secrets` | Manage all API keys stored in NeonDB |
| Storage | `/dashboard/storage` | Cloudflare R2 file browser — list, preview, upload, delete |

The dashboard is **fully responsive** — works on desktop, tablet, and mobile. The sidebar collapses into a slide-in drawer on small screens.

### Screenshots

<table>
  <tr>
    <td align="center"><b>Landing</b><br><img src="screens/landing%20page.png" width="380"/></td>
    <td align="center"><b>Login</b><br><img src="screens/login%20page.png" width="380"/></td>
  </tr>
  <tr>
    <td align="center"><b>Dashboard Overview</b><br><img src="screens/dashboard%20page.png" width="380"/></td>
    <td align="center"><b>Topics</b><br><img src="screens/topics%20page.png" width="380"/></td>
  </tr>
  <tr>
    <td align="center"><b>Videos</b><br><img src="screens/videos%20page.png" width="380"/></td>
    <td align="center"><b>Pipeline</b><br><img src="screens/pipeline%20page.png" width="380"/></td>
  </tr>
  <tr>
    <td align="center"><b>Settings</b><br><img src="screens/settings%20page.png" width="380"/></td>
    <td align="center"><b>Secrets</b><br><img src="screens/secrets%20page.png" width="380"/></td>
  </tr>
  <tr>
    <td align="center"><b>Storage</b><br><img src="screens/storage%20page.png" width="380"/></td>
    <td></td>
  </tr>
</table>

---

## Database Schema

```mermaid
erDiagram
    TOPICS {
        uuid id PK
        text title
        text description
        text niche
        text[] keywords
        enum status "queued|processing|used|skipped"
        int priority
        timestamp created_at
        timestamp updated_at
    }

    VIDEOS {
        uuid id PK
        uuid topic_id FK
        text title
        text script
        text youtube_url
        text youtube_id
        text r2_key
        text thumbnail_r2_key
        int duration_seconds
        enum status "pending|generating|uploading|published|failed"
        text error_message
        jsonb metadata "cost + engagement + channel stats"
        timestamp created_at
        timestamp published_at
    }

    SETTINGS {
        text key PK
        text value
        timestamp updated_at
    }

    TOPICS ||--o{ VIDEOS : "generates"
```

### `metadata` JSONB structure (per video)

```json
{
  "claude":     { "input_tokens": 1100, "output_tokens": 172, "cost_usd": 0.0059 },
  "elevenlabs": { "chars": 688, "cost_usd": 0.1376 },
  "kling":      { "clips": 16, "seconds": 160, "cost_usd": 11.20 },
  "total_usd":  11.3435,
  "engagement": { "views": 120, "likes": 8, "comments": 1, "synced_at": "..." },
  "channel":    { "subscribers": 5, "total_views": 142, "synced_at": "..." }
}
```

---

## Cost Per Video

Based on actual fal.ai invoices (Kling 2.6 Pro charges $0.07/second):

| Component | Tool | Typical cost |
|---|---|---|
| Script | Claude Sonnet 4.6 | ~$0.006 |
| Voiceover | ElevenLabs Multilingual v2 | ~$0.14 |
| Video clips (16 × 10 s) | Kling 2.6 Pro via fal.ai | ~$11.20 |
| Assembly | FFmpeg (free) | $0.00 |
| Storage | Cloudflare R2 | ~$0.01 |
| **Total** | | **~$11.35** |

> Cost tracking is automatic — the pipeline reports a breakdown to `/api/videos/complete` and stores it in `videos.metadata`. View per-video costs in Dashboard → Videos (hover the green cost badge for a breakdown).

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/Ismat-Samadov/short_publisher
cd short_publisher
npm install
pip install -r scripts/requirements.txt
```

### 2. Create NeonDB database

1. Go to [console.neon.tech](https://console.neon.tech) → create a project
2. Copy the connection string
3. Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the 4 required values:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
PIPELINE_SECRET_KEY=<random 32-char string>
DASHBOARD_PASSWORD=<strong password>
AUTH_TOKEN=<random 64-char hex — run: openssl rand -hex 32>
```

### 3. Push database schema

```bash
npm run db:push
```

### 4. Start the dashboard locally

```bash
npm run dev
# → http://localhost:3000/dashboard
```

### 5. Add all API keys via Dashboard → Secrets

Log in and go to `/dashboard/secrets`. Add keys for:

- **Anthropic** (Claude API)
- **ElevenLabs** (TTS + voice ID)
- **fal.ai** (Kling 2.6 Pro video generation)
- **Cloudflare R2** (video storage)
- **YouTube** (OAuth client ID/secret + refresh token — see below)
- **Telegram** (bot token + chat ID)
- **Resend** (email notifications)
- **GitHub** (PAT for triggering Actions from dashboard)

### 6. Get YouTube OAuth refresh token

You need a token with **both** `youtube.upload` and `youtube.readonly` scopes:

```bash
python scripts/get_youtube_token.py
# Opens browser → authorize → writes YOUTUBE_REFRESH_TOKEN to .env.local
```

Then paste the token into Dashboard → Secrets → YouTube → Refresh Token.

### 7. Deploy to Vercel

Push to GitHub — Vercel auto-deploys. Only add these 4 env vars in **Vercel → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | NeonDB connection string |
| `PIPELINE_SECRET_KEY` | Same as local |
| `DASHBOARD_PASSWORD` | Dashboard login password |
| `AUTH_TOKEN` | Session cookie secret |

Everything else lives in NeonDB (managed via the Secrets page).

### 8. Configure GitHub Actions

Go to **GitHub → Settings → Secrets → Actions** and add only 2 secrets:

| Secret | Value |
|---|---|
| `APP_URL` | `https://your-app.vercel.app` |
| `PIPELINE_SECRET_KEY` | Same value as Vercel |

The workflow file (`.github/workflows/publish.yml`) runs daily at 09:00 UTC. All API keys are fetched from NeonDB at runtime by the pipeline.

#### GitHub Actions compute limits

| Option | Cost | Capacity |
|---|---|---|
| GitHub Free | $0 | ~2,000 min/month ≈ 80 videos/month |
| GitHub Pro | $4/month | Unlimited minutes |
| Self-hosted runner | VPS cost only | Unlimited, zero Actions minutes |

To use a self-hosted runner: provision a Ubuntu VPS, [install the runner agent](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners), then change `runs-on: ubuntu-latest` to `runs-on: self-hosted` in `.github/workflows/publish.yml`.

### 9. Test with a dry run

**Dashboard → Pipeline → Dry Run**

Or directly via GitHub: **Actions → Publish YouTube Short → Run workflow → ✓ Dry run → Run workflow**

A dry run executes all steps (script, audio, video clips, assembly) but skips the YouTube upload and reports `youtube_id = dry_run_id`.

---

## Utility Scripts

```bash
# Get/refresh YouTube OAuth token (also adds youtube.readonly scope for engagement)
python scripts/get_youtube_token.py

# Backfill cost + engagement data for existing videos
node scripts/update_video_data.mjs

# Run pipeline locally (dry run — no YouTube upload)
DRY_RUN=true python scripts/pipeline.py
```

---

## Project Structure

```
short_publisher/
├── .github/workflows/
│   └── publish.yml              # Daily cron + manual trigger (dry_run input)
│
├── scripts/
│   ├── pipeline.py              # Main orchestrator — 8 steps, reports cost
│   ├── generate_script.py       # Claude Sonnet — viral hook-first scripts
│   ├── generate_audio.py        # ElevenLabs — voiceover + word timestamps
│   ├── generate_video_clips.py  # Kling 2.6 Pro via fal.ai — 9:16 clips
│   ├── assemble_video.py        # FFmpeg — normalize, concat, captions, music
│   ├── upload_youtube.py        # YouTube Data API v3
│   ├── upload_r2.py             # Cloudflare R2 (boto3)
│   ├── get_youtube_token.py     # One-time OAuth helper (upload + readonly scopes)
│   ├── update_video_data.mjs    # Backfill costs + YouTube engagement for old videos
│   └── requirements.txt
│
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Overview stats + queue preview
│   │   │   ├── topics/          # Content queue management
│   │   │   ├── videos/          # Publish history + cost/engagement display
│   │   │   ├── pipeline/        # GitHub Actions trigger + run history
│   │   │   ├── settings/        # Pipeline behavior settings
│   │   │   ├── secrets/         # API key management (stored in NeonDB)
│   │   │   └── storage/         # Cloudflare R2 file browser (CRUD)
│   │   ├── api/
│   │   │   ├── auth/            # Login / logout
│   │   │   ├── topics/          # CRUD + next-topic endpoint
│   │   │   ├── videos/          # List + complete + sync-stats
│   │   │   ├── pipeline/        # Trigger + runs (GitHub API proxy)
│   │   │   ├── settings/        # Settings CRUD + pipeline config
│   │   │   ├── secrets/         # Secrets CRUD
│   │   │   ├── storage/         # R2 list / upload / delete
│   │   │   ├── notifications/   # Test email/Telegram
│   │   │   └── webhook/         # Telegram webhook
│   │   └── components/
│   │       ├── Sidebar.tsx      # Desktop nav (hidden on mobile)
│   │       ├── MobileNav.tsx    # Mobile hamburger + slide-in drawer
│   │       ├── StatusBadge.tsx  # Coloured status chips
│   │       └── TopicForm.tsx    # Add topic form
│   └── lib/
│       ├── db/schema.ts         # Drizzle ORM — shortgen schema
│       ├── r2.ts                # Cloudflare R2 client (list/upload/delete)
│       ├── youtube-stats.ts     # YouTube engagement + channel stats
│       ├── telegram.ts          # Telegram notifications
│       ├── email.ts             # Resend email notifications
│       └── auth.ts              # Pipeline key + session validation
│
├── docs/
│   └── variables/               # Per-service setup guides
│       ├── README.md            # Variable index + quick-start order
│       ├── bootstrap.md         # Core secrets (DATABASE_URL, tokens)
│       ├── neondb.md            # NeonDB setup
│       ├── anthropic.md         # Claude API
│       ├── elevenlabs.md        # ElevenLabs TTS
│       ├── fal.md               # fal.ai / Kling 2.6 Pro
│       ├── cloudflare-r2.md     # R2 bucket + credentials
│       ├── youtube.md           # Google OAuth + YouTube API
│       ├── telegram.md          # Telegram bot
│       ├── resend.md            # Resend email
│       └── github.md            # GitHub PAT for dashboard trigger
│
├── .env.example                 # Template — only 4 vars needed
├── drizzle.config.ts
└── vercel.json
```

---

## Key Design Decisions

**Secrets in NeonDB, not environment variables.** GitHub Actions only needs `APP_URL` and `PIPELINE_SECRET_KEY`. All API keys are fetched by the pipeline at runtime from the database — no need to rotate 15 GitHub secrets when keys change.

**Cost tracking in `metadata` JSONB.** No schema migration needed. The pipeline reports a structured cost breakdown per service (Claude tokens, ElevenLabs characters, Kling seconds) to `/api/videos/complete`. Displayed in the Videos table with a hover tooltip.

**YouTube engagement sync.** The dashboard's "Sync Stats" button calls `/api/videos/sync-stats`, which fetches views/likes/comments for all published videos via the YouTube Data API and stores them in `videos.metadata.engagement`. Requires a refresh token with both `youtube.upload` and `youtube.readonly` scopes.

**Responsive UI.** The sidebar is hidden on mobile (`lg:hidden` + `lg:flex`). A `MobileNav` client component provides a fixed top bar with a hamburger menu that opens a slide-in drawer with the full navigation.

---

## License

MIT
