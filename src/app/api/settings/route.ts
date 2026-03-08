import { NextRequest, NextResponse } from 'next/server';
import { db, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function GET() {
  try {
    const all = await db.select().from(settings).orderBy(settings.key);
    return NextResponse.json(all);
  } catch (error) {
    console.error('[GET /api/settings]', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

const upsertSchema = z.object({
  settings: z.array(z.object({ key: z.string(), value: z.string() })),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = upsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    for (const { key, value } of parsed.data.settings) {
      const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value, updated_at: new Date() })
          .where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/settings]', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
