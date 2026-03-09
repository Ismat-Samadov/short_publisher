# GitHub — GH_TOKEN + GH_REPO + GH_WORKFLOW_FILE

These allow the dashboard to trigger pipeline runs and display workflow history — without you having to go to GitHub manually.

**Variables needed:**
- `GH_TOKEN`
- `GH_REPO`
- `GH_WORKFLOW_FILE`

---

## GH_TOKEN — Personal Access Token

### Step 1 — Go to token settings

1. Log in to [github.com](https://github.com)
2. Click your profile picture (top right) → **Settings**
3. Scroll to the bottom of the left sidebar → **Developer settings**
4. Click **Personal access tokens** → **Tokens (classic)**

   > Fine-grained tokens also work but classic tokens are simpler for this use case.

### Step 2 — Generate a new token

1. Click **Generate new token** → **Generate new token (classic)**
2. Fill in:
   - **Note:** `short-publisher-dashboard`
   - **Expiration:** No expiration (or 1 year if you prefer to rotate)
3. Select these scopes:
   - ✅ `repo` — full repository access (needed to trigger workflows)
   - ✅ `workflow` — allows triggering workflow_dispatch events
4. Click **Generate token**
5. Copy the token — it starts with `ghp_` or `github_pat_`

> The token is shown only once. Copy it immediately.

---

## GH_REPO

The repository where the pipeline workflow lives.

**Format:** `username/repository-name`

**Example:** `Ismat-Samadov/short_publisher`

Find it in the URL of your GitHub repository:
```
https://github.com/Ismat-Samadov/short_publisher
                   ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                   This part is GH_REPO
```

---

## GH_WORKFLOW_FILE

The filename of the GitHub Actions workflow that runs the pipeline.

**Value:** `publish.yml`

This file lives at `.github/workflows/publish.yml` in your repository. Unless you renamed it, the value is always `publish.yml`.

---

## Step 3 — Add to dashboard

Dashboard → Secrets → **GitHub** section:
- `GH_TOKEN` — your `ghp_...` or `github_pat_...` token
- `GH_REPO` — e.g. `Ismat-Samadov/short_publisher`
- `GH_WORKFLOW_FILE` — `publish.yml`

---

## What these enable in the dashboard

| Feature | Requires |
|---|---|
| **Trigger Now** button (Pipeline page) | GH_TOKEN + GH_REPO + GH_WORKFLOW_FILE |
| **Dry Run** button | same |
| **Recent Workflow Runs** table | same |
| **Run status** (success/failed/running) | same |

Without these, the Pipeline page still shows the step visualizer and info cards, but you can't trigger runs or see history from the dashboard.

---

## GitHub Actions secrets (separate from dashboard secrets)

Your GitHub repository also needs 2 secrets so the workflow can authenticate with the dashboard API:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

| Secret name | Value |
|---|---|
| `APP_URL` | Your Vercel deployment URL (e.g. `https://short-publisher.vercel.app`) |
| `PIPELINE_SECRET_KEY` | Same value as in your Vercel env vars |

These 2 secrets are all GitHub Actions needs. Everything else is loaded from the dashboard DB at runtime.

---

## Troubleshooting

**"Bad credentials"** — the token is wrong or expired. Generate a new one.

**"Not Found" when triggering** — the `GH_REPO` or `GH_WORKFLOW_FILE` is wrong. Check for typos and make sure the workflow file exists.

**"Resource not accessible by integration"** — the token doesn't have the `workflow` scope. Edit the token and add it.

**Workflow triggered but nothing happens** — check the **Actions** tab in your GitHub repository for errors. Common cause: the `APP_URL` or `PIPELINE_SECRET_KEY` GitHub secrets are not set correctly.

**Token expiration** — if you set an expiration date, GitHub emails you before it expires. Rotate it in dashboard → Secrets → `GH_TOKEN`.
