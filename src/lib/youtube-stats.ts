import { getSecret } from './secrets';

async function getAccessToken(): Promise<string> {
  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getSecret('YOUTUBE_CLIENT_ID'),
    getSecret('YOUTUBE_CLIENT_SECRET'),
    getSecret('YOUTUBE_REFRESH_TOKEN'),
  ]);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YouTube OAuth credentials not configured in Secrets.');
  }

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await resp.json();
  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${data.error_description ?? data.error}`);
  }
  return data.access_token as string;
}

export interface VideoStats {
  // raw counts
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  // computed engagement rates (useful for pattern analysis)
  engagement_rate: number;  // (likes + comments) / views * 100, or 0 if no views
  like_rate: number;        // likes / views * 100
  comment_rate: number;     // comments / views * 100
  views_per_day: number;    // views / days since yt_published_at (velocity)
  // snippet data
  yt_published_at: string | null;  // actual YouTube publish time (may differ from DB published_at)
  yt_tags: string[];
  yt_category_id: string | null;
  // contentDetails
  yt_duration: string | null;         // ISO 8601, e.g. "PT45S"
  yt_duration_seconds: number | null; // parsed seconds
  yt_definition: string | null;       // "hd" | "sd"
  synced_at: string;
}

export interface ChannelStats {
  subscribers: number;
  total_views: number;
  video_count: number;
  synced_at: string;
}

export async function fetchVideoStats(youtubeId: string): Promise<VideoStats | null> {
  const stats = await fetchMultipleVideoStats([youtubeId]);
  return stats.get(youtubeId) ?? null;
}

/**
 * Batch-fetch stats for multiple YouTube video IDs in a single API call.
 * YouTube supports up to 50 IDs per request. Chunks automatically if needed.
 * Uses a single access token for all requests.
 */
/** Parse ISO 8601 duration (e.g. "PT1M30S") to total seconds. */
function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0', 10) * 3600) +
         (parseInt(m[2] ?? '0', 10) * 60) +
          parseInt(m[3] ?? '0', 10);
}

export async function fetchMultipleVideoStats(youtubeIds: string[]): Promise<Map<string, VideoStats>> {
  if (youtubeIds.length === 0) return new Map();
  const token = await getAccessToken();
  const result = new Map<string, VideoStats>();
  const now = new Date().toISOString();

  // YouTube API allows up to 50 IDs per request
  for (let i = 0; i < youtubeIds.length; i += 50) {
    const chunk = youtubeIds.slice(i, i + 50);
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) {
      console.error('[fetchMultipleVideoStats] API error:', resp.status, await resp.text());
      continue;
    }
    const data = await resp.json();
    for (const item of data.items ?? []) {
      const s = item.statistics ?? {};
      const sn = item.snippet ?? {};
      const cd = item.contentDetails ?? {};

      const views    = parseInt(s.viewCount     ?? '0', 10);
      const likes    = parseInt(s.likeCount     ?? '0', 10);
      const comments = parseInt(s.commentCount  ?? '0', 10);

      const ytPublishedAt = sn.publishedAt ?? null;
      let viewsPerDay = 0;
      if (ytPublishedAt && views > 0) {
        const daysSince = (Date.now() - new Date(ytPublishedAt).getTime()) / 86_400_000;
        viewsPerDay = daysSince > 0 ? Math.round(views / daysSince) : views;
      }

      const ytDuration = cd.duration ?? null;
      const ytDurationSeconds = ytDuration ? parseIsoDuration(ytDuration) : null;

      result.set(item.id, {
        views,
        likes,
        comments,
        favorites: parseInt(s.favoriteCount ?? '0', 10),
        engagement_rate: views > 0 ? +((likes + comments) / views * 100).toFixed(3) : 0,
        like_rate:       views > 0 ? +(likes / views * 100).toFixed(3) : 0,
        comment_rate:    views > 0 ? +(comments / views * 100).toFixed(3) : 0,
        views_per_day:   viewsPerDay,
        yt_published_at: ytPublishedAt,
        yt_tags:         sn.tags ?? [],
        yt_category_id:  sn.categoryId ?? null,
        yt_duration:     ytDuration,
        yt_duration_seconds: ytDurationSeconds,
        yt_definition:   cd.definition ?? null,
        synced_at: now,
      });
    }
  }

  return result;
}

export async function fetchChannelStats(): Promise<ChannelStats | null> {
  const token = await getAccessToken();
  const resp = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json();
  const item = data.items?.[0];
  if (!item) return null;

  const s = item.statistics;
  return {
    subscribers: parseInt(s.subscriberCount ?? '0', 10),
    total_views: parseInt(s.viewCount        ?? '0', 10),
    video_count: parseInt(s.videoCount       ?? '0', 10),
    synced_at:   new Date().toISOString(),
  };
}
