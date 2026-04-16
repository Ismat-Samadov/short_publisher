/**
 * GET /api/settings/pipeline
 * Returns all pipeline-relevant settings as a flat key→value object.
 * Called by pipeline.py at the start of each run.
 * Authenticated with the pipeline secret key.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, settings } from '@/lib/db/schema';
import { validatePipelineKey } from '@/lib/auth';

const DEFAULTS: Record<string, string> = {
  youtube_visibility: 'public',
  youtube_category_id: '28',
  youtube_made_for_kids: 'false',
  schedule_enabled: 'true',
  schedule_cron: '0 9 * * *',
  videos_per_day: '1',
  video_duration_target: '55',
  script_tone: 'educational',
  default_niche: 'Technology',
  elevenlabs_voice_id: '',
  captions_enabled: 'true',
  approval_required: 'false',
  email_on_publish: 'true',
  email_on_failure: 'true',
  email_daily_digest: 'false',
  notify_on_success: 'true',
  notify_on_failure: 'true',
};

export async function GET(req: NextRequest) {
  if (!validatePipelineKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db.select().from(settings);
    const config: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('[GET /api/settings/pipeline]', error);
    // Return defaults so pipeline can still run even if DB is down
    return NextResponse.json(DEFAULTS);
  }
}
