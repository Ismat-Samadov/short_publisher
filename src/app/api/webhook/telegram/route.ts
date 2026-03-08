import { NextRequest, NextResponse } from 'next/server';
import { db, videos, topics } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;

async function sendReply(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  if (TELEGRAM_WEBHOOK_SECRET && secret !== TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body?.message;

    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId: number = message.chat.id;
    const text: string = message.text.trim();
    const command = text.split(' ')[0].toLowerCase();

    if (command === '/status') {
      const recentVideos = await db
        .select()
        .from(videos)
        .orderBy(desc(videos.created_at))
        .limit(5);

      if (recentVideos.length === 0) {
        await sendReply(chatId, '📹 No videos found yet.');
      } else {
        const lines = recentVideos.map((v, i) => {
          const statusEmoji =
            v.status === 'published'
              ? '✅'
              : v.status === 'failed'
              ? '❌'
              : '⏳';
          const link = v.youtube_url
            ? ` — <a href="${v.youtube_url}">Watch</a>`
            : '';
          return `${i + 1}. ${statusEmoji} ${v.title ?? 'Untitled'}${link}`;
        });

        await sendReply(
          chatId,
          `<b>Recent Videos</b>\n\n${lines.join('\n')}`
        );
      }
    } else if (command === '/queue') {
      const [result] = await db
        .select()
        .from(topics)
        .where(eq(topics.status, 'queued'));

      // Count manually since we can't use count() easily here
      const queuedTopics = await db
        .select()
        .from(topics)
        .where(eq(topics.status, 'queued'));

      const count = queuedTopics.length;
      await sendReply(
        chatId,
        `📋 <b>Queued Topics:</b> ${count}\n\nRun the pipeline to process the next topic.`
      );
      void result; // suppress unused warning
    } else if (command === '/help') {
      await sendReply(
        chatId,
        [
          '<b>Available Commands</b>',
          '',
          '/status — Show last 5 videos',
          '/queue — Show queued topics count',
          '/help — Show this message',
        ].join('\n')
      );
    } else {
      await sendReply(chatId, 'Unknown command. Send /help for available commands.');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/webhook/telegram]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
