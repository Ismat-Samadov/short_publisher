import { NextRequest, NextResponse } from 'next/server';
import { db, topics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateTopicSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  niche: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional(),
  status: z.enum(['queued', 'processing', 'used', 'skipped']).optional(),
  priority: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date(),
    };

    const [updated] = await db
      .update(topics)
      .set(updateData)
      .where(eq(topics.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/topics/:id]', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(topics)
      .where(eq(topics.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/topics/:id]', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
