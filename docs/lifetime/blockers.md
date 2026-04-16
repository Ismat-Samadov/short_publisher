# Blocker Fixes — Selling Short Publisher as Software

## Blocker 1 — Setup Complexity

**Root cause:** 6+ services, ~60 manual steps, no validation that things are wired correctly.

### Fixes

**a) Vercel Deploy Button** — add one line to README:
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR/repo&env=DATABASE_URL,PIPELINE_SECRET_KEY,DASHBOARD_PASSWORD,AUTH_TOKEN)
```
Pre-fills the 4 Vercel env vars during deploy. Zero code changes needed.

**b) Health check page** (`/dashboard/onboarding`) — API route that tests each secret: calls ElevenLabs API, fal.ai, R2 list-bucket, Telegram `getMe`, YouTube token introspection. Shows a green/red checklist. Buyers see immediately what's broken instead of digging through logs.

**c) `setup.sh`** — shell script that runs `openssl rand -hex 16` for the two random keys and prints a ready-to-paste `.env.local` block. 20 lines, saves 15 minutes of confusion.

The SETUP.md is already solid — the gap is **no feedback loop**. Buyers can't tell if they configured things correctly until a pipeline run fails.

---

## Blocker 2 — API Cost Transparency

**Root cause:** Costs are partially visible (settings page shows per-clip cost) but not surfaced anywhere a buyer sees before purchasing.

### Fixes

**a) Cost tracker on `/dashboard/videos`** — `metadata` JSONB already stores per-run cost breakdown. Just render it in the video table (currently not displayed).

**b) Cost estimator widget** — static UI on `/dashboard/settings` that calculates `N clips × $1.40 + ~$0.30 Claude + ~$0.10 ElevenLabs = total/video × videos/month`. No backend needed.

**c) Product listing copy** — add a "Running costs" section to every marketplace listing:
```
This is a one-time purchase. API costs are separate and paid to each provider:
• ~$1.40 per Kling clip (3 clips recommended = $4.20/video)
• ~$0.30 Claude script generation
• ~$0.10 ElevenLabs voice
• Total: ~$4.60/video | ~$138/month at 1 video/day
```
Setting this expectation upfront eliminates refund requests.

---

## Blocker 3 — GitHub Actions Limits

**Root cause:** Free tier = 2,000 min/month. At ~25 min/run that's ~80 runs/month — fine for 1/day, breaks at 2–3/day.

### Fixes

**a) Document limits clearly** — add a "Compute costs" section to SETUP.md:
```
GitHub Free:         2,000 min/month ≈ 80 videos/month (fine for 1/day)
GitHub Pro ($4/mo):  unlimited minutes — worth it at 2+ videos/day
Self-hosted runner:  run on any VPS, zero Actions minutes consumed
```

**b) Self-hosted runner support** — the workflow already runs on `ubuntu-latest`. Document that buyers can change `runs-on: self-hosted` and point a $6/month VPS at their repo. No pipeline code changes needed.

**c) Docker support (bigger lift)** — package `scripts/` + ffmpeg as a `Dockerfile`. Buyers run `docker run` locally or on a VPS, bypassing GitHub Actions entirely. Pipeline already reads config from `APP_URL` + `PIPELINE_SECRET_KEY` — it would work unchanged.

---

## Blocker 4 — No One-Click Install

**Root cause:** Buyers must manually fork, configure Vercel, set GitHub secrets, run `db:push`, and handle YouTube OAuth. Each step is a dropout opportunity.

### Fixes

**a) Vercel Deploy Button** — same as Blocker 1a. Handles Vercel deployment in one click.

**b) `npm run setup` wizard** — interactive Node.js script (`scripts/setup.mjs`) that:
1. Prompts for each env var with validation
2. Tests the DB connection and runs `db:push`
3. Writes `.env.local`
4. Prints exact GitHub secrets to copy-paste

**c) YouTube OAuth in dashboard** — currently `get_youtube_token.py` requires local Python. Move to a `/dashboard/settings/youtube-auth` page that does the OAuth flow in the browser (redirect → callback → store refresh token in DB). Removes the only step that requires local tooling.

---

## Priority Order

| Fix | Impact | Effort |
|---|---|---|
| Vercel Deploy Button | High | 5 min |
| Cost transparency in listing copy | High | 30 min |
| Document GH Actions limits + self-hosted runner | High | 30 min |
| Cost tracker on videos page (use existing metadata) | Medium | 2–3 hours |
| Health check / onboarding page | Medium | 4–6 hours |
| YouTube OAuth in dashboard | High | 1 day |
| Docker support | Medium | 1–2 days |
| `npm run setup` wizard | Low | 4–6 hours |

Start with the first three — pure documentation/config, zero code, eliminate the most common buyer drop-offs.
