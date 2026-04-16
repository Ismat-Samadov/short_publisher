/**
 * PATCH /api/videos/[id]
 * Update mutable fields on a video record (currently: metadata cost fields).
 * Dashboard-authenticated.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, videos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateSession } from '@/lib/auth';
import { z } from 'zod';

const costSchema = z.object({
  total_usd: z.number().min(0),
  claude: z.object({
    input_tokens: z.number().int().min(0).optional(),
    output_tokens: z.number().int().min(0).optional(),
    cost_usd: z.number().min(0),
  }).optional(),
  elevenlabs: z.object({
    chars: z.number().int().min(0).optional(),
    cost_usd: z.number().min(0),
  }).optional(),
  kling: z.object({
    clips: z.number().int().min(0).optional(),
    seconds: z.number().min(0).optional(),
    cost_usd: z.number().min(0),
  }).optional(),
});

const patchSchema = z.object({
  cost: costSchema,
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }

    const { cost } = parsed.data;

    // Fetch existing metadata so we don't lose engagement/channel data
    const [existing] = await db.select({ metadata: videos.metadata }).from(videos).where(eq(videos.id, id));
    if (!existing) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const updated = {
      ...(existing.metadata as Record<string, unknown> ?? {}),
      ...cost,
    };

    const [video] = await db
      .update(videos)
      .set({ metadata: updated })
      .where(eq(videos.id, id))
      .returning();

    return NextResponse.json(video);
  } catch (err) {
    console.error('[PATCH /api/videos/[id]]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
