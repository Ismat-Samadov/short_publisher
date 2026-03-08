import { NextRequest, NextResponse } from 'next/server';
import { db, topics } from '@/lib/db/schema';
import { desc, eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const createTopicSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  niche: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  priority: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = db.select().from(topics);

    if (status) {
      const results = await db
        .select()
        .from(topics)
        .where(eq(topics.status, status as 'queued' | 'processing' | 'used' | 'skipped'))
        .orderBy(desc(topics.priority), asc(topics.created_at));
      return NextResponse.json(results);
    }

    const results = await query
      .orderBy(desc(topics.priority), asc(topics.created_at));

    return NextResponse.json(results);
  } catch (error) {
    console.error('[GET /api/topics]', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, niche, keywords, priority } = parsed.data;

    const [topic] = await db
      .insert(topics)
      .values({
        title,
        description: description ?? null,
        niche: niche ?? null,
        keywords: keywords ?? [],
        priority,
        status: 'queued',
      })
      .returning();

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('[POST /api/topics]', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
