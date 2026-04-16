# Anthropic — ANTHROPIC_API_KEY

Used by the pipeline to generate viral YouTube Shorts scripts with Claude Sonnet.

**Cost:** ~$0.01 per video script (very cheap — Claude is fast and the scripts are short).

---

## Step 1 — Create an account

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up with your email
3. Verify your email address

---

## Step 2 — Add billing

Claude API is not free. You need to add a payment method.

1. Go to **Settings** → **Billing**
2. Click **Add payment method**
3. Add a credit card
4. Set a **monthly spend limit** — recommended: $10–20/month for safety

At ~$0.01 per video, $10 = 1,000 scripts. You'll never hit this limit.

---

## Step 3 — Create an API key

1. Go to **API Keys** in the left sidebar (or Settings → API Keys)
2. Click **Create Key**
3. Name it `short-publisher`
4. Copy the key — it starts with `sk-ant-api03-`

> The key is shown only once. Copy it immediately and save it somewhere safe.

---

## Step 4 — Add to dashboard

1. Go to your dashboard → **Secrets**
2. Find **Anthropic API Key**
3. Paste the key and click **Save**

---

## Model used

The pipeline uses `claude-sonnet-4-6` — the best balance of quality and cost in 2026.

If you want to switch models, update `generate_script.py` line:
```python
model="claude-sonnet-4-6",
```

Available models:
| Model | Speed | Cost | Quality |
|---|---|---|---|
| `claude-haiku-4-5-20251001` | Fastest | Cheapest | Good |
| `claude-sonnet-4-6` | Fast | Medium | **Best for scripts** |
| `claude-opus-4-6` | Slower | Expensive | Highest |

---

## Troubleshooting

**401 Unauthorized** — the key is wrong or has been revoked. Generate a new one.

**529 Overloaded** — Anthropic is at capacity. The pipeline retries automatically.

**"Your credit balance is too low"** — add credits in the Anthropic console.
