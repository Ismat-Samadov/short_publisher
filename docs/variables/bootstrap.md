# Bootstrap Variables

These 4 variables must be set manually in Vercel because they are needed before the app can connect to the database. They cannot be stored in the dashboard.

---

## PIPELINE_SECRET_KEY

A random secret shared between the dashboard and GitHub Actions. GitHub Actions sends it in every API request header so the dashboard can verify the request is legitimate.

**Generate it:**

```bash
openssl rand -hex 32
# Example output: a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

Or use any password manager to generate a 32+ character random string.

**Add to:**
- Vercel → Settings → Environment Variables → `PIPELINE_SECRET_KEY`
- GitHub → Settings → Secrets and variables → Actions → `PIPELINE_SECRET_KEY`

Both values must be identical.

---

## DASHBOARD_PASSWORD

The password you enter to log into the admin dashboard at `/login`.

Choose a strong password. There is no account recovery — if you forget it, update the env var on Vercel and redeploy.

**Add to:**
- Vercel → Settings → Environment Variables → `DASHBOARD_PASSWORD`

---

## AUTH_TOKEN

A random string stored in the HTTP-only session cookie after login. Changing this value invalidates all active sessions (everyone gets logged out).

**Generate it:**

```bash
openssl rand -hex 32
# Example output: 9b3c7a1e5f2d8b4c6a0e3f7d9b1a5c3e7f2b4d6a8c0e2f4b6d8a0c2e4f6b8d0
```

**Add to:**
- Vercel → Settings → Environment Variables → `AUTH_TOKEN`

---

## DATABASE_URL

Your NeonDB PostgreSQL connection string. See [neondb.md](./neondb.md) for how to get this.

**Format:**
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Add to:**
- Vercel → Settings → Environment Variables → `DATABASE_URL`

---

## APP_URL

Your Vercel deployment URL. The GitHub Actions pipeline uses this to call the dashboard API (fetch topics, report results, load secrets).

**Format:** `https://your-project.vercel.app`

Find it in: Vercel → your project → Deployments → the production URL.

**Add to:**
- GitHub → Settings → Secrets and variables → Actions → `APP_URL`

> Note: also store in Dashboard → Secrets → `APP_URL` so it's available for email templates.

---

## BACKGROUND_MUSIC_URL *(optional)*

A direct URL to an MP3 file played at 12% volume under the voiceover. Must be a raw file URL (not a webpage).

**Free sources:**
- [pixabay.com/music](https://pixabay.com/music/) — right-click the download button → Copy link address
- [freemusicarchive.org](https://freemusicarchive.org/)
- [incompetech.com](https://incompetech.com/)

**Test it:** paste the URL in your browser — it should download or play an MP3 directly, not open a webpage.

Leave empty for voice-only output.

**Add to:** Dashboard → Secrets → `BACKGROUND_MUSIC_URL`
