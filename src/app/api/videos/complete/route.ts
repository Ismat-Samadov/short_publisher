import { NextRequest, NextResponse } from 'next/server';
import { db, videos, topics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validatePipelineKey } from '@/lib/auth';
import { sendVideoPublished, sendPipelineError } from '@/lib/telegram';
import { getR2Url } from '@/lib/r2';
import { z } from 'zod';

const completeSchema = z.object({
  topic_id: z.string().uuid(),
  title: z.string().optional(),
  script: z.string().optional(),
  youtube_url: z.string().url().optional(),
  youtube_id: z.string().optional(),
  r2_key: z.string().optional(),
  thumbnail_r2_key: z.string().optional(),
  duration_seconds: z.number().int().optional(),
  status: z.enum(['published', 'failed']),
  error_message: z.string().optional(),
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
        published_at: status === 'published' ? new Date() : null,
      })
      .returning();

    // Update topic status
    const topicStatus = status === 'published' ? 'used' : 'queued';
    await db
      .update(topics)
      .set({ status: topicStatus, updated_at: new Date() })
      .where(eq(topics.id, topic_id));

    // Send Telegram notifications
    if (status === 'published' && youtube_url && title) {
      const thumbnailUrl = thumbnail_r2_key ? getR2Url(thumbnail_r2_key) : undefined;
      await sendVideoPublished(title, youtube_url, thumbnailUrl).catch((err) =>
        console.error('[Telegram] Failed to send publish notification:', err)
      );
    } else if (status === 'failed' && error_message) {
      await sendPipelineError('video-pipeline', error_message).catch((err) =>
        console.error('[Telegram] Failed to send error notification:', err)
      );
    }

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('[POST /api/videos/complete]', error);
    return NextResponse.json({ error: 'Failed to complete video' }, { status: 500 });
  }
}
