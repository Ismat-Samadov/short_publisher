# Environment Variables — Setup Guides

All secrets are managed from the admin dashboard at `/dashboard/secrets` and stored in NeonDB.
You only need **4 vars on Vercel** and **2 secrets on GitHub Actions** to bootstrap the system.

---

## Bootstrap Variables (set manually — not in dashboard)

| Variable | Platform | Guide |
|---|---|---|
| `DATABASE_URL` | Vercel | [neondb.md](./neondb.md) |
| `PIPELINE_SECRET_KEY` | Vercel + GitHub Actions | [bootstrap.md](./bootstrap.md) |
| `DASHBOARD_PASSWORD` | Vercel | [bootstrap.md](./bootstrap.md) |
| `AUTH_TOKEN` | Vercel | [bootstrap.md](./bootstrap.md) |
| `APP_URL` | GitHub Actions | [bootstrap.md](./bootstrap.md) |

---

## Secrets (managed from Dashboard → Secrets)

| Variable | Service | Guide |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude AI | [anthropic.md](./anthropic.md) |
| `ELEVENLABS_API_KEY` | ElevenLabs | [elevenlabs.md](./elevenlabs.md) |
| `ELEVENLABS_VOICE_ID` | ElevenLabs | [elevenlabs.md](./elevenlabs.md) |
| `FAL_KEY` | fal.ai (Kling 2.5) | [fal.md](./fal.md) |
| `R2_ACCOUNT_ID` | Cloudflare R2 | [cloudflare-r2.md](./cloudflare-r2.md) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 | [cloudflare-r2.md](./cloudflare-r2.md) |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | [cloudflare-r2.md](./cloudflare-r2.md) |
| `R2_BUCKET_NAME` | Cloudflare R2 | [cloudflare-r2.md](./cloudflare-r2.md) |
| `R2_PUBLIC_URL` | Cloudflare R2 | [cloudflare-r2.md](./cloudflare-r2.md) |
| `YOUTUBE_CLIENT_ID` | Google Cloud | [youtube.md](./youtube.md) |
| `YOUTUBE_CLIENT_SECRET` | Google Cloud | [youtube.md](./youtube.md) |
| `YOUTUBE_REFRESH_TOKEN` | Google OAuth | [youtube.md](./youtube.md) |
| `TELEGRAM_BOT_TOKEN` | Telegram | [telegram.md](./telegram.md) |
| `TELEGRAM_CHAT_ID` | Telegram | [telegram.md](./telegram.md) |
| `RESEND_API_KEY` | Resend | [resend.md](./resend.md) |
| `RESEND_FROM_EMAIL` | Resend | [resend.md](./resend.md) |
| `CONTACT_NOTIFICATION_EMAIL` | — | [resend.md](./resend.md) |
| `GH_TOKEN` | GitHub | [github.md](./github.md) |
| `GH_REPO` | GitHub | [github.md](./github.md) |
| `GH_WORKFLOW_FILE` | GitHub | [github.md](./github.md) |
| `APP_URL` | Vercel | [bootstrap.md](./bootstrap.md) |
| `BACKGROUND_MUSIC_URL` | Any CDN | [bootstrap.md](./bootstrap.md) |

---

## Quick start order

1. [neondb.md](./neondb.md) — set up database first
2. [bootstrap.md](./bootstrap.md) — generate random secrets, deploy to Vercel
3. [anthropic.md](./anthropic.md) — script generation
4. [elevenlabs.md](./elevenlabs.md) — voiceover
5. [fal.md](./fal.md) — video clips
6. [cloudflare-r2.md](./cloudflare-r2.md) — video storage
7. [youtube.md](./youtube.md) — publishing (most steps)
8. [telegram.md](./telegram.md) — notifications
9. [resend.md](./resend.md) — email notifications
10. [github.md](./github.md) — pipeline trigger from dashboard
