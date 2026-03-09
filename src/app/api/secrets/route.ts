/**
 * GET /api/secrets
 * Returns all secrets (DB + env overrides) as a flat object.
 * Called by pipeline.py at startup to load all API keys.
 * Protected by PIPELINE_SECRET_KEY — never exposed to the browser.
 *
 * POST /api/secrets
 * Upsert one or more secrets. Called by the dashboard secrets page.
 * Protected by PIPELINE_SECRET_KEY (or session — handled by middleware).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validatePipelineKey } from '@/lib/auth';
import { getAllSecrets, invalidateSecretsCache } from '@/lib/secrets';

export async function GET(req: NextRequest) {
  if (!validatePipelineKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const secrets = await getAllSecrets();
    return NextResponse.json(secrets);
  } catch (error) {
    console.error('[GET /api/secrets]', error);
    return NextResponse.json({ error: 'Failed to load secrets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Dashboard calls this — authenticated by session cookie (middleware protects /dashboard,
  // but this API is called from the client). Validate pipeline key OR check session cookie.
  const sessionCookie = req.cookies.get('sp_auth')?.value;
  const validSession = sessionCookie && sessionCookie === process.env.AUTH_TOKEN;
  const validPipelineKey = validatePipelineKey(req);

  if (!validSession && !validPipelineKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    // Accepts: { key: string, value: string }[] or { secrets: { key, value }[] }
    const pairs: { key: string; value: string }[] = Array.isArray(body)
      ? body
      : body.secrets ?? [];

    for (const { key, value } of pairs) {
      const dbKey = `secret_${key}`;
      const existing = await db.select().from(settings).where(eq(settings.key, dbKey)).limit(1);
      if (existing.length > 0) {
        await db.update(settings).set({ value, updated_at: new Date() }).where(eq(settings.key, dbKey));
      } else {
        await db.insert(settings).values({ key: dbKey, value });
      }
    }

    invalidateSecretsCache();
    return NextResponse.json({ ok: true, saved: pairs.length });
  } catch (error) {
    console.error('[POST /api/secrets]', error);
    return NextResponse.json({ error: 'Failed to save secrets' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionCookie = req.cookies.get('sp_auth')?.value;
  const validSession = sessionCookie && sessionCookie === process.env.AUTH_TOKEN;
  if (!validSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { key } = await req.json();
    await db.delete(settings).where(eq(settings.key, `secret_${key}`));
    invalidateSecretsCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/secrets]', error);
    return NextResponse.json({ error: 'Failed to delete secret' }, { status: 500 });
  }
}
