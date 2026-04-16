import { Resend } from 'resend';
import { getSecret } from './secrets';

async function getResend() {
  const apiKey = await getSecret('RESEND_API_KEY');
  const from = await getSecret('RESEND_FROM_EMAIL');
  const to = await getSecret('CONTACT_NOTIFICATION_EMAIL');

  if (!apiKey || !to) {
    console.warn('[Email] RESEND_API_KEY or CONTACT_NOTIFICATION_EMAIL not configured, skipping.');
    return null;
  }
  return { client: new Resend(apiKey), from: from || 'noreply@example.com', to };
}

/* ─── HTML helpers ──────────────────────────────────────── */

function wrap(content: string, previewText: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:#08080a;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;color:#f2f2f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #232328;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #232328;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-size:16px;line-height:32px;">&#9889;</span>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <span style="font-size:15px;font-weight:700;color:#f2f2f7;">Short Publisher</span>
                <span style="display:block;font-size:10px;color:#52525b;margin-top:1px;">AI Video Pipeline</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #232328;background:#0d0d10;">
            <p style="margin:0;font-size:11px;color:#3f3f46;line-height:1.6;">
              Automated notification from your Short Publisher pipeline.<br/>
              <a href="${appUrl}/dashboard" style="color:#8b5cf6;text-decoration:none;">Open Dashboard</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h(text: string, color = '#f2f2f7') {
  return `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${color};letter-spacing:-0.5px;">${text}</h1>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #1c1c20;vertical-align:top;width:100px;">
      <span style="font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
    </td>
    <td style="padding:8px 0 8px 16px;border-bottom:1px solid #1c1c20;vertical-align:top;">
      <span style="font-size:13px;color:#c8c8d4;">${value}</span>
    </td>
  </tr>`;
}

function btn(text: string, href: string, color = '#8b5cf6') {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;margin-right:8px;padding:10px 22px;background:${color};border-radius:8px;color:#fff;font-size:13px;font-weight:600;text-decoration:none;">${text}</a>`;
}

function pill(text: string, bg: string, fg: string) {
  return `<span style="display:inline-block;padding:3px 10px;background:${bg};border-radius:99px;font-size:11px;font-weight:600;color:${fg};">${text}</span>`;
}

/* ─── Email functions ───────────────────────────────────── */

export async function sendVideoPublishedEmail(
  videoTitle: string,
  youtubeUrl: string,
  duration?: number,
  niche?: string
): Promise<void> {
  const r = await getResend();
  if (!r) return;
  const appUrl = await getSecret('APP_URL');

  const durationStr = duration
    ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
    : null;

  const content = `
    ${h('Video Published ✓', '#10b981')}
    <p style="margin:0 0 20px;font-size:14px;color:#8e8ea0;line-height:1.6;">Your pipeline completed. A new Short is live on YouTube.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1c1c20;">
      ${row('Title', `<strong style="color:#f2f2f7;">${videoTitle}</strong>`)}
      ${row('Status', pill('Published', 'rgba(16,185,129,0.12)', '#10b981'))}
      ${niche ? row('Niche', niche) : ''}
      ${durationStr ? row('Duration', `${durationStr}`) : ''}
      ${row('YouTube', `<a href="${youtubeUrl}" style="color:#8b5cf6;text-decoration:none;word-break:break-all;">${youtubeUrl}</a>`)}
    </table>
    ${btn('Watch on YouTube', youtubeUrl, '#ff0000')}
    ${btn('Dashboard', `${appUrl}/dashboard/videos`)}
  `;

  const { error } = await r.client.emails.send({
    from: r.from, to: r.to,
    subject: `✅ Published: ${videoTitle}`,
    html: wrap(content, `Published: ${videoTitle}`, appUrl),
  });
  if (error) console.error('[Email] sendVideoPublishedEmail:', error);
}

export async function sendPipelineErrorEmail(
  step: string,
  errorMessage: string,
  topicTitle?: string
): Promise<void> {
  const r = await getResend();
  if (!r) return;
  const appUrl = await getSecret('APP_URL');

  const content = `
    ${h('Pipeline Error', '#ef4444')}
    <p style="margin:0 0 20px;font-size:14px;color:#8e8ea0;line-height:1.6;">The pipeline failed and did not complete.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1c1c20;">
      ${row('Status', pill('Failed', 'rgba(239,68,68,0.12)', '#ef4444'))}
      ${topicTitle ? row('Topic', topicTitle) : ''}
      ${row('Step', `<code style="font-size:12px;color:#a78bfa;background:#1c1c20;padding:2px 6px;border-radius:4px;">${step}</code>`)}
      ${row('Error', `<pre style="margin:0;font-size:11px;font-family:monospace;color:#fca5a5;white-space:pre-wrap;word-break:break-word;">${errorMessage.slice(0, 600)}</pre>`)}
    </table>
    ${btn('View Pipeline', `${appUrl}/dashboard/pipeline`, '#ef4444')}
    ${btn('Dashboard', `${appUrl}/dashboard`, '#52525b')}
  `;

  const { error } = await r.client.emails.send({
    from: r.from, to: r.to,
    subject: `❌ Pipeline error at: ${step}`,
    html: wrap(content, `Pipeline error: ${step}`, appUrl),
  });
  if (error) console.error('[Email] sendPipelineErrorEmail:', error);
}

export async function sendDailyDigestEmail(stats: {
  published: number; failed: number; queued: number; totalAllTime: number;
}): Promise<void> {
  const r = await getResend();
  if (!r) return;
  const appUrl = await getSecret('APP_URL');

  const successRate = stats.published + stats.failed > 0
    ? Math.round((stats.published / (stats.published + stats.failed)) * 100)
    : 0;

  const statBoxes = [
    { label: 'Published', value: stats.published, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Failed', value: stats.failed, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    { label: 'In Queue', value: stats.queued, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: 'All Time', value: stats.totalAllTime, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  ].map(s => `<td width="25%" style="padding:4px;">
    <div style="background:${s.bg};border-radius:10px;padding:16px 12px;text-align:center;">
      <div style="font-size:26px;font-weight:700;color:${s.color};line-height:1;">${s.value}</div>
      <div style="font-size:10px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px;">${s.label}</div>
    </div>
  </td>`).join('');

  const content = `
    ${h('Daily Digest')}
    <p style="margin:0 0 24px;font-size:14px;color:#8e8ea0;line-height:1.6;">24-hour pipeline summary.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>${statBoxes}</tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1c1c20;">
      ${row('Success Rate', `${successRate}%`)}
      ${row('Total Published', `${stats.totalAllTime} Shorts`)}
    </table>
    ${btn('View Dashboard', `${appUrl}/dashboard`)}
  `;

  const { error } = await r.client.emails.send({
    from: r.from, to: r.to,
    subject: `📊 Daily Digest — ${stats.published} published, ${stats.queued} queued`,
    html: wrap(content, 'Short Publisher Daily Digest', appUrl),
  });
  if (error) console.error('[Email] sendDailyDigestEmail:', error);
}
