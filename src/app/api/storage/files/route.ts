/**
 * GET  /api/storage/files?prefix=&token=  — list R2 objects
 * DELETE /api/storage/files?key=          — delete an R2 object
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { listR2Files, deleteFromR2 } from '@/lib/r2';
import { db, videos } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  if (!validateSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') ?? '';
  const token = searchParams.get('token') ?? undefined;

  try {
    const result = await listR2Files(prefix || undefined, token || undefined);

    // Fetch all r2_keys referenced by DB videos so we can flag them
    const dbVideos = await db.select({ r2_key: videos.r2_key, thumbnail_r2_key: videos.thumbnail_r2_key }).from(videos);
    const referencedKeys = new Set<string>();
    for (const v of dbVideos) {
      if (v.r2_key) referencedKeys.add(v.r2_key);
      if (v.thumbnail_r2_key) referencedKeys.add(v.thumbnail_r2_key);
    }

    const files = result.files.map((f) => ({
      ...f,
      inDb: referencedKeys.has(f.key),
    }));

    return NextResponse.json({ files, nextToken: result.nextToken, isTruncated: result.isTruncated });
  } catch (err) {
    console.error('[storage/files GET]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!validateSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  try {
    await deleteFromR2(key);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[storage/files DELETE]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
