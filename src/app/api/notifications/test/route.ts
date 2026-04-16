import { NextRequest, NextResponse } from 'next/server';
import { sendVideoPublishedEmail, sendPipelineErrorEmail, sendDailyDigestEmail } from '@/lib/email';
import { sendMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  const { type } = await req.json();

  try {
    if (type === 'email_publish') {
      await sendVideoPublishedEmail(
        'Test Video: 10 Mind-Blowing AI Facts',
        'https://youtu.be/dQw4w9WgXcQ',
        87,
        'Technology'
      );
    } else if (type === 'email_error') {
      await sendPipelineErrorEmail(
        'generate_video_clips',
        'TimeoutError: Kling 2.5 clip generation exceeded 300s limit.',
        'Test Video: 10 Mind-Blowing AI Facts'
      );
    } else if (type === 'email_digest') {
      await sendDailyDigestEmail({ published: 7, failed: 1, queued: 12, totalAllTime: 43 });
    } else if (type === 'telegram') {
      await sendMessage('🔔 <b>Test notification</b>\n\nShort Publisher is configured correctly.');
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Test notification]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
