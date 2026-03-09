# YouTube — OAuth Credentials + Refresh Token

YouTube publishing uses Google's OAuth 2.0. You need credentials from Google Cloud Console and a refresh token tied to your YouTube channel.

**Variables needed:**
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

---

## Step 1 — Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it `short-publisher`
4. Click **Create**
5. Make sure the new project is selected in the dropdown

---

## Step 2 — Enable YouTube Data API v3

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for `YouTube Data API v3`
3. Click it → click **Enable**

---

## Step 3 — Configure OAuth consent screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** → click **Create**
3. Fill in:
   - **App name:** `Short Publisher`
   - **User support email:** your Gmail
   - **Developer contact email:** your Gmail
4. Click **Save and Continue** through the Scopes screen (no changes needed)
5. On the **Test users** screen:
   - Click **Add users**
   - Add the Gmail account that owns your YouTube channel
   - Click **Save and Continue**
6. Click **Back to Dashboard**

> Your app will be in **Testing** mode. This is fine — you only need it to authorize your own account. You do not need to publish the app.

---

## Step 4 — Create OAuth credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Desktop app**
4. Name: `short-publisher-desktop`
5. Click **Create**
6. A dialog shows your credentials — copy both:
   - **Client ID** → `YOUTUBE_CLIENT_ID` (ends in `.apps.googleusercontent.com`)
   - **Client Secret** → `YOUTUBE_CLIENT_SECRET` (starts with `GOCSPX-`)

---

## Step 5 — Generate the refresh token

The refresh token grants permanent upload access to your YouTube channel without requiring re-authorization.

Run this script from your local machine (one-time setup):

```bash
cd short_publisher
python scripts/get_youtube_token.py
```

What happens:
1. The script starts a local web server on port 8080
2. It prints an authorization URL — open it in your browser
3. Log in with the **Google account that owns your YouTube channel**
4. Grant permission to "manage your YouTube account"
5. Google redirects to `localhost:8080` — the script captures the token automatically
6. The script prints: `YOUTUBE_REFRESH_TOKEN=1//0c...`

Copy this token → `YOUTUBE_REFRESH_TOKEN`.

### If the script fails

Make sure your `.env.local` has:
```
YOUTUBE_CLIENT_ID=your-client-id
YOUTUBE_CLIENT_SECRET=your-client-secret
```

And that port 8080 is not in use:
```bash
lsof -i :8080    # Mac/Linux
netstat -ano | findstr :8080   # Windows
```

---

## Step 6 — Add to dashboard

Dashboard → Secrets → **YouTube** section:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

---

## Which channel does it publish to?

The channel is determined by **whichever Google account you authorized in Step 5**. If you have multiple YouTube channels under one Google account, it publishes to the **default channel**.

To switch channels:
1. Delete the current `YOUTUBE_REFRESH_TOKEN` from the dashboard
2. Re-run `get_youtube_token.py` logged in as the target account
3. Save the new token

---

## Video settings

Videos are uploaded with these defaults (configurable in Dashboard → Settings):

| Setting | Default | Options |
|---|---|---|
| Visibility | Public | Public, Unlisted, Private |
| Category | 28 (Science & Tech) | See [category IDs](https://developers.google.com/youtube/v3/docs/videoCategories/list) |
| Made for kids | No | Yes / No |

---

## Troubleshooting

**"Access blocked: app has not completed verification"** — go to the OAuth consent screen → Test Users → add your Gmail. You're in Testing mode which is intentional.

**"Token has been expired or revoked"** — re-run `get_youtube_token.py` to generate a new refresh token. This happens if you revoke access in your Google account settings or if the token hasn't been used in 6 months.

**"Upload quota exceeded"** — YouTube allows 6 uploads per day by default. Uploading more than 6 videos per day requires requesting an increased quota from Google.

**Video stays "processing" for hours** — this is normal for new channels. YouTube processes the video on their end. It will eventually become available.

**Video not showing as a Short** — make sure the video is exactly 1080×1920 (9:16 vertical) and under 3 minutes. The pipeline produces 1080×1920 output automatically.
