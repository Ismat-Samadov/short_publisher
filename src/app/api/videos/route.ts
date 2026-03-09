import { NextRequest, NextResponse } from 'next/server';
import { db, videos, topics } from '@/lib/db/schema';
import { desc, eq, ne } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let results;

    if (status) {
      results = await db
        .select({ video: videos, topic: topics })
        .from(videos)
        .leftJoin(topics, eq(videos.topic_id, topics.id))
        .where(eq(videos.status, status as 'pending' | 'generating' | 'uploading' | 'published' | 'failed'))
        .orderBy(desc(videos.created_at));
    } else {
      results = await db
        .select({ video: videos, topic: topics })
        .from(videos)
        .leftJoin(topics, eq(videos.topic_id, topics.id))
        .where(ne(videos.status, 'failed'))
        .orderBy(desc(videos.created_at));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[GET /api/videos]', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
