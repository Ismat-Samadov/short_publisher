import { NextRequest, NextResponse } from 'next/server';
import { db, videos, topics, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validatePipelineKey } from '@/lib/auth';
import { sendVideoPublished, sendPipelineError } from '@/lib/telegram';
import { sendVideoPublishedEmail, sendPipelineErrorEmail } from '@/lib/email';
import { getR2UrlSync } from '@/lib/r2';
import { z } from 'zod';

const completeSchema = z.object({
  topic_id: z.string().uuid(),
  title: z.string().nullish(),
  script: z.string().nullish(),
  youtube_url: z.string().url().nullish(),
  youtube_id: z.string().nullish(),
  r2_key: z.string().nullish(),
  thumbnail_r2_key: z.string().nullish(),
  duration_seconds: z.number().int().nullish(),
  status: z.enum(['published', 'failed']),
  error_message: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
});

export async function POST(req: NextRequest) {
  if (!validatePipelineKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = completeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      topic_id,
      title,
      script,
      youtube_url,
      youtube_id,
      r2_key,
      thumbnail_r2_key,
      duration_seconds,
      status,
      error_message,
      metadata,
    } = parsed.data;

    // Create video record
    const [video] = await db
      .insert(videos)
      .values({
        topic_id,
        title: title ?? null,
        script: script ?? null,
        youtube_url: youtube_url ?? null,
        youtube_id: youtube_id ?? null,
        r2_key: r2_key ?? null,
        thumbnail_r2_key: thumbnail_r2_key ?? null,
        duration_seconds: duration_seconds ?? null,
        status,
        error_message: error_message ?? null,
        metadata: metadata ?? null,
        published_at: status === 'published' ? new Date() : null,
      })
      .returning();

    // Update topic status
    const topicStatus = status === 'published' ? 'used' : 'queued';
    await db
      .update(topics)
      .set({ status: topicStatus, updated_at: new Date() })
      .where(eq(topics.id, topic_id));

    // Fetch topic + notification settings in parallel
    const [[topicRow], settingRows] = await Promise.all([
      db.select().from(topics).where(eq(topics.id, topic_id)),
      db.select().from(settings),
    ]);

    const cfg: Record<string, string> = {};
    settingRows.forEach((r) => { cfg[r.key] = r.value; });
    const flag = (key: string, fallback = 'true') => (cfg[key] ?? fallback) === 'true';

    // Send notifications gated on dashboard toggles — failures are non-fatal
    if (status === 'published' && youtube_url && title) {
      const thumbnailUrl = thumbnail_r2_key ? getR2UrlSync(thumbnail_r2_key) : undefined;
      const notifs: Promise<unknown>[] = [];
      if (flag('notify_on_success')) notifs.push(sendVideoPublished(title, youtube_url, thumbnailUrl));
      if (flag('email_on_publish')) notifs.push(sendVideoPublishedEmail(title, youtube_url, duration_seconds ?? undefined, topicRow?.niche ?? undefined));
      if (notifs.length) {
        await Promise.allSettled(notifs).then((results) =>
          results.forEach((r) => { if (r.status === 'rejected') console.error('[Notify] Error:', r.reason); })
        );
      }
    } else if (status === 'failed' && error_message) {
      const notifs: Promise<unknown>[] = [];
      if (flag('notify_on_failure')) notifs.push(sendPipelineError('video-pipeline', error_message));
      if (flag('email_on_failure')) notifs.push(sendPipelineErrorEmail('video-pipeline', error_message, topicRow?.title ?? undefined));
      if (notifs.length) {
        await Promise.allSettled(notifs).then((results) =>
          results.forEach((r) => { if (r.status === 'rejected') console.error('[Notify] Error:', r.reason); })
        );
      }
    }

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('[POST /api/videos/complete]', error);
    return NextResponse.json({ error: 'Failed to complete video' }, { status: 500 });
  }
}
