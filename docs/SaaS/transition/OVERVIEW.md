# Short Publisher → SaaS Transformation Overview

> This document is an honest engineering and business assessment of what it takes to turn Short Publisher from a single-user tool into a paid multi-tenant platform. Read it before writing a single line of SaaS code.

---

## Table of Contents

1. [What You Have Today](#1-what-you-have-today)
2. [Is SaaS Possible?](#2-is-saas-possible)
3. [The Three Hard Problems](#3-the-three-hard-problems)
4. [SaaS Business Models (pick one)](#4-saas-business-models)
5. [What Can Be Reused vs Rebuilt](#5-what-can-be-reused-vs-rebuilt)
6. [Full Component Audit](#6-full-component-audit)
7. [Recommended Approach](#7-recommended-approach)
8. [Migration Phases](#8-migration-phases)
9. [Infrastructure Costs at Scale](#9-infrastructure-costs-at-scale)
10. [What Is NOT Possible](#10-what-is-not-possible)

---

## 1. What You Have Today

A **single-user admin tool** with:

| Layer | What it is |
|-------|-----------|
| Frontend | Next.js dashboard — one admin account, one password |
| Database | NeonDB — no user/org concept anywhere |
| Compute | GitHub Actions cron on **your** repo |
| AI | One set of API keys (Claude, ElevenLabs, Kling/fal.ai) |
| Storage | One Cloudflare R2 bucket, global credentials |
| YouTube | One channel, one OAuth refresh token |
| Secrets | Stored in the `settings` table — globally, no tenant column |

Everything is wired for one person. Zero multi-tenancy exists in the code today.

---

## 2. Is SaaS Possible?

**Yes — but the effort is substantial and the business model choice drives all technical decisions.**

The core pipeline logic (script → audio → video → publish) is sound and can serve multiple users. The problem is that every layer around it assumes exactly one user. Nothing is dangerous or structurally broken — it just needs to be rebuilt with tenant isolation.

Rough honest estimate for a single developer:

| Scope | Hours |
|-------|-------|
| Auth + multi-tenancy (DB + API) | 60–80 h |
| Frontend (tenant context, billing UI) | 25–35 h |
| Billing integration (Stripe) | 15–20 h |
| Compute refactor (see §3) | 40–80 h depending on model |
| YouTube OAuth per-user | 10–15 h |
| Testing + hardening | 20–30 h |
| **Total** | **~170–260 h** |

That is 2–4 months of solo full-time work. Not a weekend project.

---

## 3. The Three Hard Problems

These are the problems that will determine your entire architecture. Solve these first — everything else is mechanical.

---

### Problem 1: Compute (GitHub Actions)

**This is the hardest problem.**

Today the pipeline runs on *your* GitHub Actions account. GitHub gives 2,000 free minutes/month — enough for ~250 videos. For a SaaS serving many users, you have two options:

#### Option A — Each user connects their own GitHub repo (BYOK Compute)

Users create a GitHub repo, copy the workflow file, and paste their GitHub PAT into your dashboard. Your platform stores their PAT + repo name, and triggers runs on their behalf.

```
User A: PAT_A → github.com/userA/short-publisher-fork
User B: PAT_B → github.com/userB/short-publisher-fork
```

- ✅ Zero compute cost for you
- ✅ Works today with minimal changes to trigger/runs API
- ✅ Each user pays their own GitHub Actions bill
- ❌ High setup friction — users must fork a repo and configure secrets
- ❌ Your workflow file must be kept in sync across all forks
- ❌ Will lose ~70% of potential users who are not technical

#### Option B — Replace GitHub Actions with a managed queue (Recommended)

Replace GitHub Actions entirely with a proper job queue. The pipeline.py script doesn't care where it runs — it just needs Python + FFmpeg + internet.

Good options:
- **Modal** (`modal.com`) — serverless Python, pay per second, great for this workload
- **Railway** — persistent workers, simple deployment
- **Inngest** — durable job queue with retry, integrates with Next.js natively
- **AWS Batch / Fargate** — more ops overhead but fully managed

```
User queues a topic → your job queue runs pipeline.py in an isolated container
                     → uses user's API keys (fetched from DB)
                     → uploads to user's YouTube channel
```

- ✅ Zero user setup friction
- ✅ Full control over execution environment
- ✅ Can scale to hundreds of users
- ❌ **You pay for compute** (Modal costs ~$0.06/min on an A10G GPU; pipeline takes ~8 min = ~$0.50/run for compute alone)
- ❌ 2–4 weeks of additional work to migrate
- ❌ Must manage FFmpeg/font dependencies in container image

**Recommendation:** Start with Option A (BYOK Compute) for the MVP — it gets you to revenue fastest with the least infrastructure risk. Migrate to Option B in v2 once you have paying customers funding it.

---

### Problem 2: YouTube OAuth Per-User

Today there is exactly one `YOUTUBE_REFRESH_TOKEN` in the database. Every video goes to your channel.

For SaaS, each user must connect their own YouTube channel via OAuth. This requires:

1. A proper OAuth2 flow in your app:
   - `GET /api/auth/youtube/connect` — redirect user to Google consent screen
   - `GET /api/auth/youtube/callback` — exchange code for access + refresh tokens
   - Store `{ user_id, refresh_token, channel_id, channel_name }` in a new `user_youtube_credentials` table

2. The pipeline must receive the correct token for each job:
   - Job payload includes `youtube_refresh_token` (fetched from DB by your backend)
   - `upload_youtube.py` uses whatever token was passed in

3. Token refresh: YouTube access tokens expire in 1 hour. The pipeline already re-fetches from the dashboard — this mechanism stays, just scoped per user.

**Effort: ~10–15 hours**

---

### Problem 3: API Keys — Who Pays?

This determines your entire pricing model. Two options:

#### Option A — Bring Your Own Keys (BYOK)
Users paste their own Claude, ElevenLabs, fal.ai keys into your dashboard. You charge a flat platform fee. Users absorb all AI costs directly.

```
Your revenue: $X/month subscription
Your costs: hosting + DB + (optional) compute
User's costs: ~$4/video directly billed to their accounts
```

- ✅ Zero financial risk from AI costs
- ✅ Simple business model
- ✅ Works perfectly with the existing secrets architecture
- ❌ High setup friction — users need 4 different API accounts
- ❌ Smaller addressable market (only technical users will bother)

#### Option B — Managed Keys (You absorb costs)
You have one set of keys, absorb all costs, charge per video (or a subscription with a video credit system).

```
Your revenue: $20/month = 5 videos/month (at ~$4 cost each)
Your costs: ~$4/video × users × videos
Margin: ~0% on video cost alone + you still need to charge for platform overhead
```

- ✅ Frictionless user experience
- ❌ **High financial risk**: one user running 100 videos/month = $400 in costs
- ❌ Requires strict rate limiting and usage caps
- ❌ Requires credit/quota system, not just a subscription
- ❌ One stolen account or abuse = direct financial loss for you

**Recommendation:** Start with BYOK. It's honest about the cost structure and attracts technically capable early adopters who will give better feedback. Move to managed keys only after validating willingness to pay.

---

## 4. SaaS Business Models

### Model 1: BYOK Platform (Recommended for MVP)

**What it is:** Users bring all their own API keys. You charge for the dashboard, scheduling, analytics, and multi-channel management.

**Pricing example:**
- Free tier: 3 videos/month (to validate)
- Starter: $19/month — unlimited videos, 1 YouTube channel
- Pro: $49/month — unlimited videos, 3 channels, analytics
- Agency: $149/month — unlimited channels, team seats, priority support

**Your infrastructure cost per user:** ~$2–5/month (Vercel + NeonDB + fraction of R2)

**Gross margin:** ~85–90%

**Verdict: Best starting model.** Low risk, high margin, honest pricing.

---

### Model 2: Credits SaaS

**What it is:** You manage all API keys. Users buy video credits. $X = N videos/month.

**Pricing example:**
- Starter: $29/month — 5 videos ($5.80/video, ~$1.80 margin)
- Growth: $79/month — 25 videos ($3.16/video, ~-$0.84 margin — you lose money!)
- Pro: $199/month — 75 videos ($2.65/video — you lose significant money)

The math is brutal: at scale, you'll lose money on every video unless you charge well above the API cost, and users will push back on that.

**Verdict: Viable only if you have API volume discounts (you don't, at MVP scale) or if your charges-per-video are much higher than market will bear.**

---

### Model 3: White-Label / Agency Tool

**What it is:** Agencies or content creators pay for a fully branded version they can resell to their clients.

**Pricing example:**
- $299/month per agency seat
- Agencies use their own API keys
- They manage multiple client YouTube channels from one dashboard

**This is the highest-revenue model** but requires multi-workspace support (beyond just multi-user).

---

## 5. What Can Be Reused vs Rebuilt

### ✅ Can Be Reused Directly

| Component | Notes |
|-----------|-------|
| All Python pipeline scripts | `pipeline.py`, `generate_script.py`, etc. — pure workhorses, no user context |
| Pipeline step logic | Works with any API keys passed in |
| Dashboard UI components | Sidebar, StatusBadge, TopicForm, etc. |
| Videos page | Add `user_id` filter to API call |
| Settings page | Add `org_id` scoping to API |
| R2 upload logic | Add `org_id` prefix to object key |
| `/api/settings/pipeline` | Add `org_id` param |
| GitHub trigger/runs API | Add per-user token support |

### ⚠️ Can Be Adapted (Medium effort)

| Component | What Changes |
|-----------|-------------|
| `src/lib/db/schema.ts` | Add `orgs`, `users` tables; add `org_id` FK to all tables |
| `src/app/api/secrets/route.ts` | Filter by `org_id` from session |
| `src/app/api/settings/route.ts` | Filter by `org_id` from session |
| `src/app/api/topics/next/route.ts` | Filter by job's `org_id` |
| `src/app/api/videos/complete/route.ts` | Add `org_id` to created video |
| R2 path structure | `org/{org_id}/videos/{topic_id}/{ts}.mp4` |
| `pipeline.py` | Accept `org_id` in job context |

### ❌ Must Be Rebuilt

| Component | Why |
|-----------|-----|
| `src/middleware.ts` | Needs JWT/session with user context, not a static token |
| `src/app/api/auth/login/route.ts` | Single password → email + password / OAuth2 |
| `src/lib/auth.ts` | Needs real user session management |
| GitHub Actions compute | Replace with queue OR per-user PAT model |
| YouTube OAuth flow | One token → per-user OAuth2 flow |
| Billing | Does not exist yet — add Stripe |

---

## 6. Full Component Audit

### Authentication
| Item | Current | SaaS Requirement |
|------|---------|-----------------|
| Login | Single `DASHBOARD_PASSWORD` env var | Email + password, bcrypt hash in DB |
| Session | Cookie = `AUTH_TOKEN` static env var | JWT or next-auth session with `user_id`, `org_id` |
| User table | ❌ None | `users (id, email, password_hash, org_id, role, created_at)` |
| Org table | ❌ None | `orgs (id, name, plan, stripe_customer_id, created_at)` |
| Middleware | Static cookie check | Parse JWT → attach user/org to request context |

### Database Schema
| Table | Missing Columns |
|-------|----------------|
| `topics` | `org_id uuid NOT NULL REFERENCES orgs(id)`, `user_id uuid REFERENCES users(id)` |
| `videos` | `org_id uuid NOT NULL REFERENCES orgs(id)` |
| `settings` | `org_id uuid NOT NULL` (change PK to `(org_id, key)`) |
| New: `orgs` | `id, name, plan, stripe_customer_id, stripe_subscription_id` |
| New: `users` | `id, email, password_hash, org_id, role` |
| New: `user_youtube_credentials` | `id, org_id, refresh_token, channel_id, channel_name` |
| New: `pipeline_jobs` | `id, org_id, topic_id, status, created_at, started_at, completed_at` |

### API Routes — Tenant Scoping Needed
| Route | Problem | Fix |
|-------|---------|-----|
| `GET /api/topics` | Returns ALL topics | Filter by `org_id` from session |
| `POST /api/topics` | Creates with no owner | Set `org_id` from session |
| `PATCH/DELETE /api/topics/[id]` | No ownership check | Verify topic.org_id === session.org_id |
| `GET /api/topics/next` | Returns ANY queued topic | Filter by `org_id` from job context |
| `GET /api/videos` | Returns ALL videos | Filter by `org_id` from session |
| `POST /api/videos/complete` | No org context | Job must include `org_id` |
| `GET/POST /api/settings` | Global | Scope by `org_id` |
| `GET /api/secrets` | Global | Scope by `org_id` |
| `POST /api/pipeline/trigger` | Global GitHub token | Load per-org `GH_TOKEN` from secrets |

### Billing
| Item | Current | SaaS Requirement |
|------|---------|-----------------|
| Stripe | ❌ None | Stripe Checkout + Webhooks |
| Plans | ❌ None | Free / Starter / Pro tiers in DB |
| Usage tracking | ❌ None | Video count per billing period |
| Paywalls | ❌ None | Middleware check plan limits |
| Customer portal | ❌ None | Stripe Customer Portal link |

---

## 7. Recommended Approach

### MVP Architecture: BYOK + User-Owned GitHub Actions

The fastest path to a paying product with the least infrastructure risk:

```
User onboarding:
  1. Sign up (email + password)
  2. Connect GitHub repo (paste PAT + repo name)
  3. Paste API keys (Claude, ElevenLabs, fal.ai)
  4. Connect YouTube (OAuth2 flow)
  5. Done → add topics, trigger pipeline
```

Your backend:
- Stores per-org secrets (API keys) encrypted in DB
- Triggers GitHub Actions on the user's own repo via their PAT
- Pipelines call back to your Next.js API with `org_id` in the job context
- You charge a flat subscription for the platform

**What you are NOT responsible for:**
- AI API costs (user's card)
- GitHub Actions compute (user's quota)
- YouTube API quotas (user's project)

**What you ARE responsible for:**
- Vercel hosting
- NeonDB
- Keeping the pipeline scripts updated
- Building the dashboard UX

---

## 8. Migration Phases

### Phase 0 — Foundation (2–3 weeks)
Before anything else, these must exist:

- [ ] Add `orgs` + `users` tables to schema
- [ ] Add `org_id` FK to `topics`, `videos`, `settings`
- [ ] Replace static-cookie auth with email + password (use `next-auth` or `better-auth`)
- [ ] Update all API routes to filter by `org_id` from session
- [ ] Update middleware to extract real user context

**Nothing works for existing data during this phase — plan for downtime or a migration script.**

---

### Phase 1 — Per-User Secrets + Settings (1 week)
- [ ] Change `settings` table PK to `(org_id, key)`
- [ ] Update all secrets API routes to scope by `org_id`
- [ ] Update `/api/settings/pipeline` to accept `org_id` param (pipeline must send it)
- [ ] Update `pipeline.py` to include `org_id` in all API calls

---

### Phase 2 — YouTube OAuth Per-User (1 week)
- [ ] Add `user_youtube_credentials` table
- [ ] Build OAuth2 connect flow (`/api/auth/youtube/connect` + `/callback`)
- [ ] Show connected channel in settings UI
- [ ] Pass correct refresh token to pipeline job

---

### Phase 3 — GitHub Actions Per-User (1 week)
- [ ] Store `GH_TOKEN` + `GH_REPO` + `GH_WORKFLOW_FILE` as per-org secrets
- [ ] Update trigger/runs API to use org's credentials
- [ ] Build onboarding UI: "Connect your GitHub repo"
- [ ] Provide a `workflow-template.yml` users can download and add to their repo

---

### Phase 4 — Billing (1–2 weeks)
- [ ] Add Stripe integration (`stripe` npm package)
- [ ] Create products: Free / Starter / Pro
- [ ] Add `stripe_customer_id`, `stripe_subscription_id`, `plan` to `orgs` table
- [ ] Webhook handler: `POST /api/webhooks/stripe` — sync plan on payment events
- [ ] Enforce plan limits in API (e.g., max topics in queue, max videos/month)
- [ ] Add Stripe Customer Portal link in settings

---

### Phase 5 — Onboarding UX (1 week)
- [ ] Sign up page (no invite required)
- [ ] Onboarding checklist: GitHub → API Keys → YouTube → First Topic
- [ ] Plan selection / upgrade prompt

---

### Phase 6 — Hardening (ongoing)
- [ ] Rate limiting per org
- [ ] Audit logs
- [ ] Error emails on pipeline failure (scoped per user)
- [ ] Data isolation testing

---

## 9. Infrastructure Costs at Scale

### At 100 paying users (BYOK model):

| Service | Usage | Cost/month |
|---------|-------|-----------|
| Vercel Pro | ~5M req/month | $20 |
| NeonDB | ~100 orgs × data | $19 (Scale plan) |
| Cloudflare R2 | 100 users × ~50 videos × ~50 MB | $1–5 |
| Stripe fees | 2.9% + $0.30 per transaction | ~$60 (at $19 avg) |
| **Total infra** | | **~$100–110/month** |

### Your P&L at 100 users (BYOK, $19/month Starter):
```
Revenue:  100 × $19 = $1,900/month
Infra:    ~$110/month
Stripe:   ~$60/month
Net:      ~$1,730/month (~91% gross margin)
```

Users pay their own AI costs directly. Your margin is nearly pure.

### If you go Managed Keys model at 100 users (5 videos/month each):
```
Revenue:  100 × $29 = $2,900/month
AI costs: 100 × 5 × $4 = $2,000/month
Infra:    ~$110/month
Net:      ~$790/month (27% gross margin)
```

The math gets worse as users generate more videos. Hard to sustain.

---

## 10. What Is NOT Possible

Be clear-eyed about these:

### ❌ You cannot share one GitHub Actions repo across all users
GitHub Actions runs are tied to the repo that contains the workflow. There is no multi-tenant GitHub Actions. Each user needs their own fork/repo.

### ❌ You cannot share one YouTube channel across users
YouTube Data API is OAuth-scoped. Each channel needs its own credentials. You cannot upload videos to User B's channel using User A's token.

### ❌ You cannot launch SaaS this weekend
The auth system, database schema, and billing do not exist. Attempting to add users without Phase 0 will result in data leaks between tenants — a security incident.

### ❌ You cannot make the BYOK model frictionless (to non-technical users)
Getting API keys from 4 different services (Anthropic, ElevenLabs, fal.ai, and optionally GitHub) requires technical familiarity. Your early users will be developers or technical content creators. That's fine for a v1 — design for them.

### ❌ You cannot charge $5/month and be profitable on managed keys
At ~$4/video in AI costs + $0.50 compute (if using Modal), every video you generate costs you ~$4.50. You need to charge $10+/video or $49+/month for a 5-video plan to have any margin.

### ⚠️ Partial: You can run multiple users on one NeonDB instance
NeonDB supports multiple schemas or row-level security. With `org_id` on every table, isolation is achievable without multiple databases. Just add the column and enforce it in every query.

### ⚠️ Partial: You can share one R2 bucket with path-based isolation
`org/{org_id}/videos/...` gives logical isolation. Not true ACL isolation, but acceptable for a v1. Add per-user presigned URLs so users never see each other's storage directly.

---

## Quick Decision Checklist

Before you start writing code, answer these:

- [ ] **Which compute model?** User-owned GitHub Actions vs. managed queue
  - If you pick managed queue, add 4–6 weeks and $X/month compute costs to your estimates
- [ ] **Which API key model?** BYOK vs. managed
  - If managed, build a credit system before accepting money
- [ ] **What is your launch target?** (10 users? 100?)
  - 10 users: BYOK + next-auth + manual onboarding is fine
  - 100+ users: need proper onboarding flow and billing automation
- [ ] **What auth library?** `next-auth v5` (recommended) or `better-auth` or `clerk` (fastest)
  - Clerk costs $0 up to 10,000 monthly active users and saves ~2 weeks of auth work

---

*Document created: 2026-03-11*
*Based on codebase audit of commit `216f790`*
