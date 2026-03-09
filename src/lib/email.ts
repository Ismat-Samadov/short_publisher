import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
const TO = process.env.CONTACT_NOTIFICATION_EMAIL ?? '';

function isConfigured(): boolean {
  if (!process.env.RESEND_API_KEY || !TO) {
    console.warn('[Email] RESEND_API_KEY or CONTACT_NOTIFICATION_EMAIL not configured, skipping.');
    return false;
  }
  return true;
}

/** Base HTML wrapper — dark-themed, single-column */
function wrap(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:#08080a;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;color:#f2f2f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #232328;border-radius:14px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;background:linear-gradient(135deg,#0d0d12 0%,#111113 100%);border-bottom:1px solid #232328;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:16px;line-height:32px;">&#9889;</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-size:15px;font-weight:700;color:#f2f2f7;letter-spacing:-0.3px;">Short Publisher</span>
                    <span style="display:block;font-size:10px;color:#52525b;margin-top:1px;">AI Video Pipeline</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #232328;background:#0d0d10;">
              <p style="margin:0;font-size:11px;color:#3f3f46;line-height:1.6;">
                This is an automated notification from your Short Publisher pipeline.<br/>
                <a href="${process.env.APP_URL ?? '#'}/dashboard" style="color:#8b5cf6;text-decoration:none;">Open Dashboard</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Heading helper */
function h(text: string, color = '#f2f2f7'): string {
  return `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${color};letter-spacing:-0.5px;">${text}</h1>`;
}

/** Key-value row */
function row(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #1c1c20;vertical-align:top;">
      <span style="font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
    </td>
    <td style="padding:8px 0 8px 16px;border-bottom:1px solid #1c1c20;vertical-align:top;">
      <span style="font-size:13px;color:#c8c8d4;">${value}</span>
    </td>
  </tr>`;
}

/** CTA button */
function button(text: string, href: string, color = '#8b5cf6'): string {
  return `
  <a href="${href}" style="display:inline-block;margin-top:24px;padding:10px 22px;background:${color};border-radius:8px;color:#fff;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
    ${text}
  </a>`;
}

/** Status pill */
function pill(text: string, bg: string, fg: string): string {
  return `<span style="display:inline-block;padding:3px 10px;background:${bg};border-radius:99px;font-size:11px;font-weight:600;color:${fg};letter-spacing:0.02em;">${text}</span>`;
}

/* ─────────────────────────────────────────────────────────── */

export async function sendVideoPublishedEmail(
  videoTitle: string,
  youtubeUrl: string,
  duration?: number,
  niche?: string
): Promise<void> {
  if (!isConfigured()) return;

  const durationStr = duration
    ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
    : null;

  const content = `
    ${h('Video Published ✓', '#10b981')}
    <p style="margin:0 0 20px;font-size:14px;color:#8e8ea0;line-height:1.6;">
      Your pipeline completed successfully. A new Short is live on YouTube.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1c1c20;">
      ${row('Title', `<strong style="color:#f2f2f7;">${videoTitle}</strong>`)}
      ${row('Status', pill('Published', 'rgba(16,185,129,0.12)', '#10b981'))}
      ${niche ? row('Niche', niche) : ''}
      ${durationStr ? row('Duration', `${durationStr} min`) : ''}
      ${row('YouTube', `<a href="${youtubeUrl}" style="color:#8b5cf6;text-decoration:none;word-break:break-all;">${youtubeUrl}</a>`)}
    </table>
    ${button('Watch on YouTube', youtubeUrl, '#ff0000')}
    ${button('Open Dashboard', `${process.env.APP_URL ?? '#'}/dashboard/videos`, '#8b5cf6')}
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `✅ Published: ${videoTitle}`,
    html: wrap(content, `New Short published: ${videoTitle}`),
  });

  if (error) console.error('[Email] sendVideoPublishedEmail failed:', error);
}

export async function sendPipelineErrorEmail(
  step: string,
  errorMessage: string,
  topicTitle?: string
): Promise<void> {
  if (!isConfigured()) return;

  const content = `
    ${h('Pipeline Error', '#ef4444')}
    <p style="margin:0 0 20px;font-size:14px;color:#8e8ea0;line-height:1.6;">
      The pipeline encountered an error and did not complete. Review the details below.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1c1c20;">
      ${row('Status', pill('Failed', 'rgba(239,68,68,0.12)', '#ef4444'))}
      ${topicTitle ? row('Topic', topicTitle) : ''}
      ${row('Failed Step', `<code style="font-family:monospace;font-size:12px;color:#a78bfa;background:#1c1c20;padding:2px 6px;border-radius:4px;">${step}</code>`)}
      ${row('Error', `<pre style="margin:0;font-size:11px;font-family:monospace;color:#fca5a5;white-space:pre-wrap;word-break:break-word;">${errorMessage.slice(0, 600)}</pre>`)}
    </table>
    ${button('View Pipeline', `${process.env.APP_URL ?? '#'}/dashboard/pipeline`, '#ef4444')}
    ${button('Open Dashboard', `${process.env.APP_URL ?? '#'}/dashboard`, '#52525b')}
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `❌ Pipeline error at: ${step}`,
    html: wrap(content, `Pipeline error: ${step}`),
  });

  if (error) console.error('[Email] sendPipelineErrorEmail failed:', error);
}

export async function sendDailyDigestEmail(stats: {
  published: number;
  failed: number;
  queued: number;
  totalAllTime: number;
}): Promise<void> {
  if (!isConfigured()) return;

  const successRate =
    stats.published + stats.failed > 0
      ? Math.round((stats.published / (stats.published + stats.failed)) * 100)
      : 0;

  const content = `
    ${h('Daily Digest')}
    <p style="margin:0 0 24px;font-size:14px;color:#8e8ea0;line-height:1.6;">
      Here's a summary of your Short Publisher pipeline activity for the past 24 hours.
    </p>

    <!-- Stat grid -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        ${[
          { label: 'Published', value: stats.published, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Failed', value: stats.failed, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'In Queue', value: stats.queued, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'All Time', value: stats.totalAllTime, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
        ].map(s => `
          <td width="25%" style="padding:4px;">
            <div style="background:${s.bg};border-radius:10px;padding:16px 12px;text-align:center;">
              <div style="font-size:26px;font-weight:700;color:${s.color};line-height:1;">${s.value}</div>
              <div style="font-size:10px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px;">${s.label}</div>
            </div>
          </td>`).join('')}
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1c1c20;">
      ${row('Success Rate (24h)', `${successRate}%`)}
      ${row('Total Published', `${stats.totalAllTime} Shorts`)}
    </table>
    ${button('View Dashboard', `${process.env.APP_URL ?? '#'}/dashboard`)}
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `📊 Daily Digest — ${stats.published} published, ${stats.queued} queued`,
    html: wrap(content, 'Short Publisher Daily Digest'),
  });

  if (error) console.error('[Email] sendDailyDigestEmail failed:', error);
}
