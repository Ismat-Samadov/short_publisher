/**
 * update_video_data.mjs
 * Updates all existing videos with full cost + engagement data.
 * Run: node scripts/update_video_data.mjs
 */
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sql = neon(env.DATABASE_URL);

// ── Load YouTube credentials (env.local first, fallback to DB) ────────────────
async function getCredentials() {
  if (env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN) {
    return { clientId: env.YOUTUBE_CLIENT_ID, clientSecret: env.YOUTUBE_CLIENT_SECRET, refreshToken: env.YOUTUBE_REFRESH_TOKEN };
  }
  const rows = await sql`SELECT key, value FROM shortgen.settings WHERE key LIKE 'secret_YOUTUBE%'`;
  const s = Object.fromEntries(rows.map(r => [r.key.slice(7), r.value]));
  return { clientId: s.YOUTUBE_CLIENT_ID, clientSecret: s.YOUTUBE_CLIENT_SECRET, refreshToken: s.YOUTUBE_REFRESH_TOKEN };
}

async function getAccessToken() {
  const { clientId, clientSecret, refreshToken } = await getCredentials();
  if (!clientId || !clientSecret || !refreshToken) throw new Error('YouTube credentials missing');
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function youtubeGet(url, token) {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await resp.json();
  if (data.error) console.warn('  YouTube API error:', JSON.stringify(data.error));
  return data;
}

// ── Known actual costs from fal.ai invoice ────────────────────────────────────
const KNOWN_COSTS = {
  '2a39d034-a61a-4626-971e-b3c1233560f5': {
    claude:     { input_tokens: 1100, output_tokens: 222, cost_usd: 0.0066 },
    elevenlabs: { chars: 0, cost_usd: 0 },
    kling:      { clips: 0, seconds: 0, cost_usd: 0 },
    total_usd:  0.0066,
    note: 'Failed at ElevenLabs — only Claude ran.',
  },
  '4daac6a1-53b9-4120-aaaf-16879a37eeb4': {
    claude:     { input_tokens: 1100, output_tokens: 172, cost_usd: 0.0059 },
    elevenlabs: { chars: 688, cost_usd: 0.1376 },
    kling:      { clips: 16, seconds: 163, cost_usd: 11.2006, note: 'Two runs during v2.5→v2.6 fix ($4.20+$7.00+$0.0006)' },
    total_usd:  11.3441,
  },
};

// ── Main ──────────────────────────────────────────────────────────────────────
const videos = await sql`SELECT id, title, status, youtube_id, script, metadata FROM shortgen.videos ORDER BY created_at`;
console.log(`Found ${videos.length} videos\n`);

let token = null;
try {
  token = await getAccessToken();
  console.log('YouTube token: OK\n');
} catch (e) {
  console.warn(`YouTube token failed: ${e.message}\nUpdating costs only.\n`);
}

// Fetch channel stats
let channelStats = null;
if (token) {
  const data = await youtubeGet('https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true', token);
  console.log('Channel API response items:', data.items?.length ?? 0);
  if (data.items?.length) {
    const s = data.items[0].statistics;
    channelStats = {
      channel_title:  data.items[0].snippet?.title ?? '',
      subscribers:    parseInt(s.subscriberCount ?? '0', 10),
      total_views:    parseInt(s.viewCount        ?? '0', 10),
      video_count:    parseInt(s.videoCount       ?? '0', 10),
      synced_at:      new Date().toISOString(),
    };
    console.log('Channel stats:', channelStats, '\n');
  } else {
    console.warn('No channel found — token may lack youtube.readonly scope\n');
  }
}

for (const video of videos) {
  console.log(`\nVideo [${video.id}]: ${video.title}`);

  // Start from existing DB metadata so pipeline-saved costs are not lost.
  // KNOWN_COSTS entries override (for backfilling manually verified costs).
  const existing = video.metadata ?? {};
  const knownCost = KNOWN_COSTS[video.id];
  const costBase = knownCost
    ? { ...existing, ...knownCost }   // override with verified cost data
    : existing;                        // preserve whatever pipeline already saved

  if (knownCost) {
    console.log(`  Using KNOWN_COSTS override — total=$${knownCost.total_usd}`);
  } else if (existing.total_usd) {
    console.log(`  Keeping pipeline-saved cost — total=$${existing.total_usd}`);
  } else {
    console.log(`  No cost data (add to KNOWN_COSTS if needed)`);
  }

  let engagement = null;
  const realYtId = video.youtube_id && video.youtube_id !== 'dry_run_id' ? video.youtube_id : null;

  if (realYtId && token) {
    console.log(`  Fetching stats for youtube_id=${realYtId}...`);
    const data = await youtubeGet(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${realYtId}`,
      token
    );
    console.log(`  API returned ${data.items?.length ?? 0} item(s)`);
    if (data.items?.length) {
      const s = data.items[0].statistics;
      engagement = {
        views:     parseInt(s.viewCount     ?? '0', 10),
        likes:     parseInt(s.likeCount     ?? '0', 10),
        comments:  parseInt(s.commentCount  ?? '0', 10),
        synced_at: new Date().toISOString(),
      };
      console.log(`  Engagement: views=${engagement.views} likes=${engagement.likes} comments=${engagement.comments}`);
    } else {
      console.warn(`  Video not found via API (may be private, deleted, or wrong scope)`);
    }
  } else {
    console.log(`  No real YouTube ID — skipping engagement`);
  }

  const metadata = {
    ...costBase,
    ...(engagement   ? { engagement }            : {}),
    ...(channelStats ? { channel: channelStats } : {}),
  };

  await sql`UPDATE shortgen.videos SET metadata = ${JSON.stringify(metadata)}::jsonb WHERE id = ${video.id}`;
  console.log(`  Saved — cost=$${metadata.total_usd ?? 0} engagement=${engagement ? 'yes' : 'no'}`);
}

console.log('\n✓ Done.');
