# Telegram — TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID

Telegram sends you instant push notifications when a video is published or when the pipeline fails.

**Variables needed:**
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

---

## TELEGRAM_BOT_TOKEN

### Step 1 — Create a bot with BotFather

1. Open Telegram and search for **@BotFather**
2. Start a chat and send: `/newbot`
3. Enter a name: `Short Publisher`
4. Enter a username (must end in `bot`): `shortpublisher_notify_bot`
5. BotFather replies with your token:

```
Use this token to access the HTTP API:
8202323082:AAGRimO8iScakpFKTHbkwhhbmMbPANX8e3g
```

Copy this — it is your `TELEGRAM_BOT_TOKEN`.

---

## TELEGRAM_CHAT_ID

The Chat ID tells the bot where to send messages. You can send to yourself (private) or to a group.

### Option A — Personal notifications (recommended)

1. Open Telegram and search for **@userinfobot**
2. Start a chat and send any message (e.g. `/start`)
3. The bot replies with your user info including your **Id**:

```
Id: 6192509415
```

This number is your `TELEGRAM_CHAT_ID`.

4. Start a chat with your bot by searching for it by username and clicking **Start**. The bot cannot send you messages until you initiate contact.

### Option B — Group notifications

Useful if you want a team to see the notifications.

1. Create a Telegram group
2. Add your bot to the group (search by username → Add to Group)
3. Send any message in the group
4. Open this URL in your browser (replace `BOT_TOKEN` with yours):
   ```
   https://api.telegram.org/botBOT_TOKEN/getUpdates
   ```
5. Find the `chat` object in the response:
   ```json
   "chat": {
     "id": -1001234567890,
     "title": "My Group",
     "type": "group"
   }
   ```
6. The `id` value (note: negative number for groups) is your `TELEGRAM_CHAT_ID`

---

## Step 3 — Test it

After adding both values to the dashboard, go to **Dashboard → Settings → Test Notifications** and click **Telegram**.

You should receive a message from your bot within a few seconds.

---

## What notifications you receive

| Event | Message |
|---|---|
| Video published | ✅ Title, YouTube URL |
| Pipeline failed | ❌ Step name, error message |
| Test | 🔔 Simple test message |

---

## Troubleshooting

**Bot doesn't send messages** — you must start a conversation with the bot first. Search for it in Telegram and click **Start**.

**"chat not found"** — the Chat ID is wrong. Use @userinfobot to get the correct ID.

**"Forbidden: bot was blocked by the user"** — you blocked the bot. Unblock it in Telegram → the bot's profile → Unblock.

**"Bad Request: chat_id is empty"** — `TELEGRAM_CHAT_ID` is not set in the dashboard. Save it in Dashboard → Secrets.

**Group notifications not working** — make sure the bot is an admin in the group (or at least a member). For supergroups, the Chat ID starts with `-100`.
