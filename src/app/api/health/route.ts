/**
 * GET /api/health
 * Runs connectivity checks for every required external service.
 * Used by the /dashboard/onboarding page.
 * Protected by session cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSecret } from '@/lib/secrets';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export interface HealthCheck {
  id: string;
  label: string;
  status: 'ok' | 'error' | 'missing' | 'skip';
  message?: string;
  required: boolean;
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    // If we can call getSecret, the DB is reachable
    await getSecret('__health_probe__');
    return { id: 'database', label: 'NeonDB', status: 'ok', required: true };
  } catch (e) {
    return { id: 'database', label: 'NeonDB', status: 'error', message: String(e), required: true };
  }
}

async function checkAnthropic(): Promise<HealthCheck> {
  const key = await getSecret('ANTHROPIC_API_KEY');
  if (!key) return { id: 'anthropic', label: 'Anthropic (Claude)', status: 'missing', message: 'ANTHROPIC_API_KEY not set', required: true };
  return { id: 'anthropic', label: 'Anthropic (Claude)', status: 'ok', message: 'Key present', required: true };
}

async function checkElevenLabs(): Promise<HealthCheck> {
  const key = await getSecret('ELEVENLABS_API_KEY');
  const voiceId = await getSecret('ELEVENLABS_VOICE_ID');
  if (!key) return { id: 'elevenlabs', label: 'ElevenLabs', status: 'missing', message: 'ELEVENLABS_API_KEY not set', required: true };
  if (!voiceId) return { id: 'elevenlabs', label: 'ElevenLabs', status: 'missing', message: 'ELEVENLABS_VOICE_ID not set', required: true };
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { id: 'elevenlabs', label: 'ElevenLabs', status: 'error', message: `API returned ${res.status}`, required: true };
    return { id: 'elevenlabs', label: 'ElevenLabs', status: 'ok', required: true };
  } catch (e) {
    return { id: 'elevenlabs', label: 'ElevenLabs', status: 'error', message: String(e), required: true };
  }
}

async function checkFal(): Promise<HealthCheck> {
  const key = await getSecret('FAL_KEY');
  if (!key) return { id: 'fal', label: 'fal.ai (Kling)', status: 'missing', message: 'FAL_KEY not set', required: true };
  return { id: 'fal', label: 'fal.ai (Kling)', status: 'ok', message: 'Key present', required: true };
}

async function checkR2(): Promise<HealthCheck> {
  const [accountId, accessKeyId, secretKey, bucket] = await Promise.all([
    getSecret('R2_ACCOUNT_ID'),
    getSecret('R2_ACCESS_KEY_ID'),
    getSecret('R2_SECRET_ACCESS_KEY'),
    getSecret('R2_BUCKET_NAME'),
  ]);
  if (!accountId || !accessKeyId || !secretKey || !bucket) {
    return { id: 'r2', label: 'Cloudflare R2', status: 'missing', message: 'One or more R2 secrets missing', required: true };
  }
  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey: secretKey },
    });
    await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
    return { id: 'r2', label: 'Cloudflare R2', status: 'ok', required: true };
  } catch (e) {
    return { id: 'r2', label: 'Cloudflare R2', status: 'error', message: String(e), required: true };
  }
}

async function checkYouTube(): Promise<HealthCheck> {
  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getSecret('YOUTUBE_CLIENT_ID'),
    getSecret('YOUTUBE_CLIENT_SECRET'),
    getSecret('YOUTUBE_REFRESH_TOKEN'),
  ]);
  if (!clientId || !clientSecret) {
    return { id: 'youtube', label: 'YouTube OAuth', status: 'missing', message: 'YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET not set', required: true };
  }
  if (!refreshToken) {
    return { id: 'youtube', label: 'YouTube OAuth', status: 'missing', message: 'YOUTUBE_REFRESH_TOKEN not set — connect via Dashboard → Settings → YouTube Auth', required: true };
  }
  return { id: 'youtube', label: 'YouTube OAuth', status: 'ok', message: 'Client ID, secret and refresh token all present', required: true };
}

async function checkTelegram(): Promise<HealthCheck> {
  const token = await getSecret('TELEGRAM_BOT_TOKEN');
  if (!token) return { id: 'telegram', label: 'Telegram', status: 'skip', message: 'Optional — not configured', required: false };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { id: 'telegram', label: 'Telegram', status: 'error', message: data.description ?? `Status ${res.status}`, required: false };
    }
    return { id: 'telegram', label: 'Telegram', status: 'ok', message: `@${data.result?.username}`, required: false };
  } catch (e) {
    return { id: 'telegram', label: 'Telegram', status: 'error', message: String(e), required: false };
  }
}

async function checkGitHub(): Promise<HealthCheck> {
  const token = await getSecret('GH_TOKEN');
  const repo = await getSecret('GH_REPO');
  if (!token || !repo) return { id: 'github', label: 'GitHub (pipeline trigger)', status: 'skip', message: 'Optional — needed only to trigger pipeline from dashboard', required: false };
  return { id: 'github', label: 'GitHub (pipeline trigger)', status: 'ok', message: `Repo: ${repo}`, required: false };
}

async function checkResend(): Promise<HealthCheck> {
  const key = await getSecret('RESEND_API_KEY');
  if (!key) return { id: 'resend', label: 'Resend (email)', status: 'skip', message: 'Optional — not configured', required: false };
  return { id: 'resend', label: 'Resend (email)', status: 'ok', message: 'Key present', required: false };
}

export async function GET(req: NextRequest) {
  if (!validateSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks = await Promise.all([
    checkDatabase(),
    checkAnthropic(),
    checkElevenLabs(),
    checkFal(),
    checkR2(),
    checkYouTube(),
    checkTelegram(),
    checkGitHub(),
    checkResend(),
  ]);

  const allRequired = checks.filter((c) => c.required);
  const ready = allRequired.every((c) => c.status === 'ok');

  return NextResponse.json({ ready, checks });
}
