import { NextRequest, NextResponse } from 'next/server';
import { db, topics } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { validatePipelineKey } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!validatePipelineKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the highest-priority queued topic, oldest first on tie
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.status, 'queued'))
      .orderBy(desc(topics.priority), asc(topics.created_at))
      .limit(1);

    if (!topic) {
      return NextResponse.json({ error: 'No queued topics available' }, { status: 404 });
    }

    // Mark as processing
    const [updated] = await db
      .update(topics)
      .set({ status: 'processing', updated_at: new Date() })
      .where(eq(topics.id, topic.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[GET /api/topics/next]', error);
    return NextResponse.json({ error: 'Failed to fetch next topic' }, { status: 500 });
  }
}
