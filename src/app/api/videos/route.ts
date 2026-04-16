import { NextRequest, NextResponse } from 'next/server';
import { db, videos, topics } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const results = await db
      .select({ video: videos, topic: topics })
      .from(videos)
      .leftJoin(topics, eq(videos.topic_id, topics.id))
      .where(status ? eq(videos.status, status as 'pending' | 'generating' | 'uploading' | 'published' | 'failed') : undefined)
      .orderBy(desc(videos.created_at));

    return NextResponse.json(results);
  } catch (error) {
    console.error('[GET /api/videos]', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
