# Cloudflare R2 — Storage Variables

R2 is used to archive every generated video permanently. The pipeline uploads the final MP4 after assembly and before YouTube upload.

**Cost:** ~$0.01 per video (essentially free — R2 has no egress fees and the free tier covers most usage).

**Variables needed:**
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

---

## Step 1 — Create a Cloudflare account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up with your email
3. No domain needed — R2 works without one

---

## Step 2 — Enable R2

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. In the left sidebar, click **R2 Object Storage**
3. Click **Purchase R2 Plan** if prompted (the free tier is free — no credit card needed for free usage, but Cloudflare may ask for one to verify identity)

---

## Step 3 — Create a bucket

1. In R2, click **Create bucket**
2. **Name:** `shortgenerator` (or any name — this becomes `R2_BUCKET_NAME`)
3. **Location:** choose a region close to your GitHub Actions runner (US East is a safe default)
4. Click **Create bucket**

---

## Step 4 — Enable public access

The pipeline stores the R2 URL of each video in the database. For the URL to be accessible:

1. Open your bucket
2. Click **Settings** tab
3. Scroll to **Public Access**
4. Click **Allow Access** → **Allow**
5. Cloudflare generates a public URL like: `https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev`
6. Copy this URL — this is your `R2_PUBLIC_URL`

---

## Step 5 — Get your Account ID

1. In the Cloudflare dashboard, click the account name in the top-left
2. On the right panel, find **Account ID** and copy it
3. It's a 32-character hex string like `612eb8c2fbc8d81e98c37a03e49f4a8f`

This is your `R2_ACCOUNT_ID`.

---

## Step 6 — Create an API token

R2 uses S3-compatible credentials (not Cloudflare API tokens).

1. In R2, click **Manage R2 API Tokens** (top right of the R2 page)
2. Click **Create API Token**
3. Configure:
   - **Token name:** `short-publisher`
   - **Permissions:** Object Read & Write
   - **Specify bucket:** select your `shortgenerator` bucket
   - **TTL:** No expiry (or set a long expiry)
4. Click **Create API Token**
5. You'll see two values — copy both immediately:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`

> These are shown only once. If you lose the secret key, you must create a new token.

---

## Summary of values

| Variable | Where to find it |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → right sidebar → Account ID |
| `R2_ACCESS_KEY_ID` | R2 → Manage API Tokens → Create Token → Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 → Manage API Tokens → Create Token → Secret Access Key |
| `R2_BUCKET_NAME` | The name you gave the bucket (e.g. `shortgenerator`) |
| `R2_PUBLIC_URL` | Bucket → Settings → Public Access URL (e.g. `https://pub-xxxx.r2.dev`) |

**Add all to dashboard:** Dashboard → Secrets → **Cloudflare R2** section

---

## Troubleshooting

**"NoSuchBucket"** — the bucket name in `R2_BUCKET_NAME` doesn't match the actual bucket name. Check for typos.

**"InvalidAccessKeyId"** — the access key is wrong or the token has been revoked. Create a new API token.

**"Access Denied"** — the API token doesn't have permission for this bucket. Re-create the token with **Object Read & Write** for your specific bucket.

**Public URL returns 403** — public access is not enabled. Go to Bucket → Settings → Public Access → Allow Access.

**Files visible in R2 but URL doesn't work** — make sure you're using the `R2_PUBLIC_URL` (the `pub-xxxx.r2.dev` URL), not the S3-compatible API endpoint.
