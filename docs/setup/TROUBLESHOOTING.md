# Short Publisher — Troubleshooting Guide

> For seller support use. Each section maps a symptom to a root cause and a fix. Ask the buyer to paste the exact error message from GitHub Actions logs.

---

## How to Read Error Logs

All errors originate in GitHub Actions. Tell the buyer:

1. Go to their forked repo → **Actions** tab
2. Click the failed run → click the `publish` job
3. Expand the **Run pipeline** step
4. Scroll to the bottom — the error is always at the end

The pipeline prints the step it failed at:
```
✗ Pipeline failed at 'generate-script':
```

Match that step to the relevant section below.

---

## Category 1 — Setup / Configuration Errors

### Dashboard shows "Unauthorized" or redirects to login unexpectedly

**Cause:** `AUTH_TOKEN` or `DASHBOARD_PASSWORD` mismatch between Vercel env vars and what was set.

**Fix:**
1. Go to Vercel → Project → Settings → Environment Variables
2. Verify `AUTH_TOKEN` is set (it should be a long hex string, not empty)
3. Redeploy after any env var change: Deployments → three dots → Redeploy

---

### Pipeline fails immediately with `401 Unauthorized` or `403 Forbidden`

**Cause:** `PIPELINE_SECRET_KEY` in GitHub Actions secrets does not match the one in Vercel env vars.

**Fix:** Both must be identical:
- GitHub repo → Settings → Secrets → `PIPELINE_SECRET_KEY`
- Vercel → Environment Variables → `PIPELINE_SECRET_KEY`

Copy the value from Vercel and re-paste it into GitHub.

---

### `npm run db:push` fails with "relation does not exist" or SSL error

**Cause A (SSL):** Connection string missing `?sslmode=require`

**Fix:** Append to the NeonDB connection string:
```
postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

**Cause B (schema):** NeonDB free tier sometimes needs the schema created first.

**Fix:** In NeonDB SQL editor, run:
```sql
CREATE SCHEMA IF NOT EXISTS shortgen;
```
Then re-run `npm run db:push`.

---

### `npm run db:push` says "No config found" or "DATABASE_URL is not set"

**Cause:** The `.env.local` file is missing or has the wrong variable name.

**Fix:** The file must be `.env.local` (not `.env`) in the project root:
```bash
# .env.local
DATABASE_URL=postgresql://...
```

---

## Category 2 — Pipeline Fails at Startup

### `[Secrets] Failed to load from dashboard (401)`

**Cause:** Pipeline can reach the dashboard URL but `PIPELINE_SECRET_KEY` doesn't match.

**Fix:** Same as the 401 fix above — ensure both secrets are identical.

---

### `[Secrets] Could not reach dashboard` / Connection timeout

**Cause A:** `APP_URL` in GitHub secrets has a trailing slash or typo.

**Fix:** Must be exactly `https://your-app.vercel.app` — no trailing slash, no path.

**Cause B:** Vercel deployment is on a non-production URL (preview deployment).

**Fix:** Use the **production** Vercel URL, not a preview URL. In Vercel, the production URL is under Settings → Domains.

---

### `[Pipeline] No queued topics. Add topics in the dashboard.`

**Not an error.** The queue is empty.

**Fix:** Go to `/dashboard/topics` → Add Topic → set status to `queued`.

---

### `[Pipeline] Auto-publish is disabled in dashboard settings. Exiting.`

**Not an error.** The schedule toggle is off.

**Fix:** Go to `/dashboard/pipeline` → toggle **Enable auto-publish**.

---

## Category 3 — Script Generation Fails (`generate-script`)

### `AuthenticationError` or `Invalid API key`

**Cause:** `ANTHROPIC_API_KEY` is wrong, expired, or not entered.

**Fix:** Go to `/dashboard/secrets` → re-enter `ANTHROPIC_API_KEY`. Verify it at [console.anthropic.com](https://console.anthropic.com) → API Keys.

---

### `RateLimitError` from Anthropic

**Cause:** Anthropic rate limit hit (new accounts have low limits).

**Fix:** Wait a few minutes and re-trigger. Or upgrade the Anthropic account tier.

---

### `InsufficientCreditsError` from Anthropic

**Cause:** Anthropic account has no credits.

**Fix:** Add credits at [console.anthropic.com](https://console.anthropic.com) → Billing.

---

## Category 4 — Audio Generation Fails (`generate-audio`)

### `401 Unauthorized` from ElevenLabs

**Cause:** `ELEVENLABS_API_KEY` is wrong.

**Fix:** Re-enter in `/dashboard/secrets`. Find it at ElevenLabs → Profile icon → API Keys.

---

### `voice_not_found` or `422 Unprocessable Entity` from ElevenLabs

**Cause:** `ELEVENLABS_VOICE_ID` is invalid or belongs to a different account.

**Fix:**
1. Log in to [elevenlabs.io](https://elevenlabs.io) → Voices
2. Click the voice → look at the browser URL: `.../voice/VOICE_ID_HERE`
3. Copy that exact ID and re-enter in `/dashboard/secrets`

---

### `quota_exceeded` from ElevenLabs

**Cause:** Monthly character quota exhausted.

**Fix:** Upgrade ElevenLabs plan or wait until the monthly reset. Check usage at ElevenLabs → Usage.

---

## Category 5 — Video Clip Generation Fails (`generate-clips`)

### `401` or `Invalid fal key`

**Cause:** `FAL_KEY` is wrong or expired.

**Fix:** Re-enter in `/dashboard/secrets`. Generate a new key at [fal.ai](https://fal.ai) → Dashboard → API Keys.

---

### `Clip generation timeout` or clips take forever

**Cause:** fal.ai Kling generation can take 3–6 minutes per clip. With 4 clips in parallel, total time is ~6–8 minutes. This is normal.

**Fix:** Increase the GitHub Actions timeout if needed. It's set to 45 minutes in `.github/workflows/publish.yml` — more than enough.

---

### Some clips succeed but some fail — `partial_clips`

**Cause:** fal.ai occasionally fails individual generations. The pipeline continues with whatever clips it got.

**Fix:** If fewer than 2 clips succeed, the video will look poor. Re-trigger the pipeline — it will pick up the same topic if it was marked `processing` and not `used`. To reset a topic: go to `/dashboard/topics` → change its status back to `queued`.

---

## Category 6 — Assembly Fails (`assemble`)

### `ffmpeg: command not found`

**Cause:** FFmpeg is not installed in the GitHub Actions runner. This should never happen since the workflow installs it — but if the workflow was modified...

**Fix:** Check `.github/workflows/publish.yml` — confirm this step exists:
```yaml
- name: Install system dependencies
  run: |
    sudo apt-get update -qq
    sudo apt-get install -y ffmpeg fonts-dejavu-core fonts-open-sans
```
If it was removed, restore it.

---

### `No such file or directory: clips/`

**Cause:** All clip generations failed (zero clips downloaded). Usually a fal.ai auth or quota issue.

**Fix:** Fix the underlying clip generation error first (see Category 5).

---

## Category 7 — YouTube Upload Fails (`upload-youtube`)

### `HttpError 401` from YouTube API

**Cause:** `YOUTUBE_REFRESH_TOKEN` is expired or revoked.

**Fix:** Re-run `scripts/get_youtube_token.py` locally to generate a new token:
```bash
cd scripts
python get_youtube_token.py
```
Paste the new token into `/dashboard/secrets` → `YOUTUBE_REFRESH_TOKEN`.

---

### `HttpError 403: quotaExceeded`

**Cause:** YouTube Data API daily quota (10,000 units) exhausted. One upload uses ~1,600 units.

**Fix:** Wait until midnight Pacific Time (when YouTube quota resets). This happens if more than 6 videos were attempted in one day.

---

### `HttpError 403: forbidden` (not quota)

**Cause A:** The YouTube channel is not associated with the Google account used to generate the refresh token.

**Fix:** Re-run `get_youtube_token.py` and make sure to log in with the Google account that **owns the YouTube channel** — not just any Google account.

**Cause B:** YouTube API is not enabled in the Google Cloud project.

**Fix:** Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Enable APIs → search "YouTube Data API v3" → Enable.

---

### `HttpError 400: invalidMetadata`

**Cause:** The video title generated by Claude contains invalid characters (emoji, special symbols over 100 chars, etc.).

**Fix:** This is rare. If it happens repeatedly, go to `/dashboard/settings` → Script tone → try a different setting. The generated title will be different on the next run.

---

### Video uploads but shows as `processing` on YouTube for a long time

**Not an error.** YouTube processes all uploaded videos before making them public. Shorts typically take 5–30 minutes.

---

## Category 8 — R2 Upload Fails (`upload-r2`)

### `NoCredentialsError` or `InvalidAccessKeyId`

**Cause:** R2 credentials are wrong.

**Fix:** Verify in `/dashboard/secrets`:
- `R2_ACCOUNT_ID` — Cloudflare dashboard → top right
- `R2_ACCESS_KEY_ID` — from R2 API token
- `R2_SECRET_ACCESS_KEY` — from R2 API token (only shown once at creation)

If the secret access key was lost, delete the R2 API token in Cloudflare and create a new one.

---

### `NoSuchBucket`

**Cause:** `R2_BUCKET_NAME` doesn't match the actual bucket name.

**Fix:** Go to Cloudflare → R2 → verify the exact bucket name (case-sensitive) and re-enter in `/dashboard/secrets`.

---

## Category 9 — Dashboard Issues

### Videos page shows no videos after a successful pipeline run

**Cause:** The `/dashboard/videos` page is cached or the pipeline failed to call `POST /api/videos/complete`.

**Fix:** Click the Refresh button on the videos page. If still empty, check the GitHub Actions log for step `8/8 Reporting` — it should say "reporting published". If it shows a warning, the DB write failed. Check `DATABASE_URL` is still valid.

---

### Storage page shows "No files found" but R2 has files

**Cause:** The `R2_PUBLIC_URL` or bucket credentials in `/dashboard/secrets` are wrong.

**Fix:** Verify `R2_PUBLIC_URL` matches the public URL shown in Cloudflare → bucket → Settings → Public Access. It should look like `https://pub-xxxx.r2.dev`.

---

### Pipeline page "Load history" shows error or empty

**Cause:** `GH_TOKEN` or `GH_REPO` is wrong, or the token doesn't have `workflow` read permission.

**Fix:**
1. `GH_REPO` must be in format `username/repo-name` (no `https://`, no `.git`)
2. `GH_TOKEN` must be a classic Personal Access Token with `repo` and `workflow` scopes
3. Generate a new token at GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

---

## Category 10 — General Checks

When a buyer reports "it doesn't work" and can't find the error, ask them to run this checklist:

```
[ ] GitHub Actions run exists? (repo → Actions tab)
[ ] Run failed or succeeded? (green = success, red = failed)
[ ] What step did it fail at? (expand the publish job, read the last lines)
[ ] Does /dashboard load at all? (Vercel deployment might have failed)
[ ] Are all 4 Vercel env vars set? (DATABASE_URL, PIPELINE_SECRET_KEY, DASHBOARD_PASSWORD, AUTH_TOKEN)
[ ] Are GitHub repo secrets set? (APP_URL, PIPELINE_SECRET_KEY)
[ ] Is there at least one topic with status = queued? (/dashboard/topics)
[ ] Is auto-publish enabled? (/dashboard/pipeline)
```

90% of issues fall into one of:
1. Secret mismatch between Vercel and GitHub Actions
2. Missing or wrong API key in `/dashboard/secrets`
3. Empty topic queue
4. YouTube refresh token expired

---

## Requesting Logs from a Buyer

To debug any pipeline issue, ask for:

1. Screenshot of the failed GitHub Actions run (the full log of the `publish` step)
2. Screenshot of `/dashboard/secrets` — just the key names, not the values
3. The exact error message (copy-paste, not a photo)

Never ask for actual secret values. The key names alone are usually enough to identify the problem.
