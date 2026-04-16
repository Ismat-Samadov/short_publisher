/**
 * POST /api/storage/upload
 * Accepts multipart/form-data with fields: file (File), prefix (string, optional)
 * Uploads to R2 and returns { key, url }.
 * Max body size is controlled by Next.js (default 4MB for the route body).
 * For large video files use the pipeline's direct R2 upload instead.
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { uploadToR2 } from '@/lib/r2';

// Allow up to 60 s for large video uploads (Vercel Pro / self-hosted)
export const maxDuration = 60;

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };
  return map[ext] ?? 'application/octet-stream';
}

export async function POST(req: NextRequest) {
  if (!validateSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prefix = (formData.get('prefix') as string | null)?.replace(/\/$/, '') ?? 'uploads';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const key = `${prefix}/${ts}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = guessContentType(file.name);

    const url = await uploadToR2(key, buffer, contentType);
    return NextResponse.json({ ok: true, key, url });
  } catch (err) {
    console.error('[storage/upload POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
