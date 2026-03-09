# Resend — Email Notifications

Resend sends HTML email notifications when videos are published, when the pipeline fails, and daily digest summaries.

**Variables needed:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_NOTIFICATION_EMAIL`

**Cost:** Free tier includes 3,000 emails/month — more than enough for daily pipeline notifications.

---

## RESEND_API_KEY

### Step 1 — Create an account

1. Go to [resend.com](https://resend.com)
2. Click **Sign Up** — use GitHub or email
3. Verify your email

### Step 2 — Create an API key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Click **Create API Key**
3. Name it `short-publisher`
4. Permission: **Full access** (or **Sending access** if you prefer minimal permissions)
5. Domain: **All domains** (or restrict to your verified domain)
6. Click **Add**
7. Copy the key — it starts with `re_`

> The key is shown only once. Save it immediately.

---

## RESEND_FROM_EMAIL

This is the email address that appears in the **From** field of notifications. It must be a verified sender in Resend.

### Option A — Use Resend's test domain (quick setup, no domain needed)

Resend gives you `@resend.dev` for testing. Add `onboarding@resend.dev` as the from address. Works immediately, but only sends to your own email (not other recipients).

**Limitation:** `onboarding@resend.dev` only works if `CONTACT_NOTIFICATION_EMAIL` is your own verified email.

### Option B — Verify your own domain (recommended for production)

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g. `birjob.com`)
4. Resend shows you DNS records to add:
   - 2× `TXT` records for SPF and DKIM
   - 1× `MX` record (optional, for replies)
5. Add these records in your domain registrar's DNS settings
6. Click **Verify DNS Records** in Resend
7. Once verified (usually 1–5 minutes), the domain shows **Verified**

After verifying, you can send from any address at that domain:
- `noreply@birjob.com`
- `jobs@birjob.com`
- `alerts@birjob.com`

---

## CONTACT_NOTIFICATION_EMAIL

The email address where you want to **receive** pipeline notifications. This is typically your personal Gmail or work email.

Example: `ismetsemedov@gmail.com`

No setup required — just enter the address.

---

## Step 3 — Add to dashboard

Dashboard → Secrets → **Email (Resend)** section:
- `RESEND_API_KEY` — your `re_...` key
- `RESEND_FROM_EMAIL` — e.g. `jobs@birjob.com`
- `CONTACT_NOTIFICATION_EMAIL` — e.g. `ismetsemedov@gmail.com`

---

## Step 4 — Test it

Go to **Dashboard → Settings → Test Notifications** and click any of the email buttons:
- **Email: Published** — simulates a successful video publish
- **Email: Error** — simulates a pipeline failure
- **Email: Digest** — simulates a daily summary

Check your inbox at `CONTACT_NOTIFICATION_EMAIL`.

---

## Troubleshooting

**Emails going to spam** — add SPF and DKIM records for your domain. Use Option B above.

**"Domain not verified"** — DNS records haven't propagated yet. Wait 10–30 minutes and try verifying again. Use [dnschecker.org](https://dnschecker.org) to check if your TXT records are visible.

**"You can only send testing emails to your own email address"** — you're using the test domain (`resend.dev`). Either verify your own domain or make sure `CONTACT_NOTIFICATION_EMAIL` matches your Resend account email.

**No email received** — check Resend's logs at [resend.com/emails](https://resend.com/emails). Every sent email is logged there with status and any error details.

**"Invalid API key"** — the key is wrong or has been revoked. Generate a new one.
