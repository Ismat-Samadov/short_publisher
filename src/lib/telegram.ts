const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send a text message to the configured Telegram chat.
 */
export async function sendMessage(
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] BOT_TOKEN or CHAT_ID not configured, skipping.');
    return;
  }

  const response = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('[Telegram] Failed to send message:', body);
  }
}

/**
 * Notify that a video was successfully published.
 */
export async function sendVideoPublished(
  videoTitle: string,
  youtubeUrl: string,
  thumbnailUrl?: string
): Promise<void> {
  const text = [
    '✅ <b>Video Published!</b>',
    '',
    `<b>Title:</b> ${escapeHtml(videoTitle)}`,
    `<b>URL:</b> <a href="${youtubeUrl}">${youtubeUrl}</a>`,
    thumbnailUrl ? `<b>Thumbnail:</b> <a href="${thumbnailUrl}">View</a>` : '',
  ]
    .filter(Boolean)
    .join('\n');

  await sendMessage(text, 'HTML');
}

/**
 * Notify about a pipeline error.
 */
export async function sendPipelineError(
  step: string,
  error: string
): Promise<void> {
  const text = [
    '❌ <b>Pipeline Error</b>',
    '',
    `<b>Step:</b> ${escapeHtml(step)}`,
    `<b>Error:</b> <code>${escapeHtml(error.slice(0, 500))}</code>`,
  ].join('\n');

  await sendMessage(text, 'HTML');
}

/**
 * Send an approval request with script preview.
 */
export async function sendApprovalRequest(
  topicTitle: string,
  script: string,
  approvalToken: string
): Promise<void> {
  const appUrl = process.env.APP_URL ?? '';
  const approveUrl = `${appUrl}/api/approve?token=${approvalToken}&action=approve`;
  const rejectUrl = `${appUrl}/api/approve?token=${approvalToken}&action=reject`;

  const preview = script.length > 400 ? script.slice(0, 400) + '…' : script;

  const text = [
    '📝 <b>Script Approval Request</b>',
    '',
    `<b>Topic:</b> ${escapeHtml(topicTitle)}`,
    '',
    '<b>Script Preview:</b>',
    `<i>${escapeHtml(preview)}</i>`,
    '',
    `<a href="${approveUrl}">✅ Approve</a> | <a href="${rejectUrl}">❌ Reject</a>`,
  ].join('\n');

  await sendMessage(text, 'HTML');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
