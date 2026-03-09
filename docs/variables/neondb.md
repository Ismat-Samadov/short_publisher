# NeonDB — DATABASE_URL

NeonDB is a serverless PostgreSQL database. The app uses it to store topics, videos, settings, and secrets.

---

## Step 1 — Create a Neon account

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub or Google
3. You get a free tier — no credit card required

---

## Step 2 — Create a project

1. Click **New Project**
2. Name it `short-publisher` (or anything you like)
3. Choose the region closest to your Vercel deployment region (usually `AWS us-east-1` or `eu-central-1`)
4. Click **Create Project**

---

## Step 3 — Get the connection string

After the project is created, Neon shows a **Connection Details** panel.

1. Make sure **Connection string** is selected (not individual fields)
2. Set the role to your project owner role
3. Copy the string — it looks like:

```
postgresql://username:password@ep-xxx-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require
```

If you closed the dialog:
- Go to your project dashboard
- Click **Connection Details** in the left sidebar
- The connection string is shown there

---

## Step 4 — Create the shortgen schema

The app uses a dedicated PostgreSQL schema called `shortgen` (not `public`).

Run this migration from your local machine:

```bash
cd short_publisher
npm install
DATABASE_URL="your-connection-string" npx drizzle-kit push
```

This creates the `shortgen.topics`, `shortgen.videos`, and `shortgen.settings` tables.

After running, go to **Neon → Tables** in the left sidebar and verify you see the `shortgen` schema with 3 tables.

---

## Step 5 — Add to Vercel

1. Go to [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** your connection string
   - **Environments:** Production, Preview, Development (check all)
3. Click **Save**
4. Redeploy the project for the variable to take effect

---

## Connection string format

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

| Part | Example |
|---|---|
| user | `myfrog_me_owner` |
| password | `ErAVlQSW06Ih` |
| host | `ep-red-dew-a22obfoo.eu-central-1.aws.neon.tech` |
| database | `myfrog_me` |

---

## Troubleshooting

**"relation does not exist"** — the schema hasn't been pushed. Run `npx drizzle-kit push`.

**"SSL connection required"** — make sure `?sslmode=require` is at the end of the URL.

**Connection timeout** — Neon databases auto-suspend after 5 minutes of inactivity. The first request after a cold start takes 1–2 seconds longer. This is normal.
