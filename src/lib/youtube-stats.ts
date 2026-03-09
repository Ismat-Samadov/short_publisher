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
  views: number;
  likes: number;
  comments: number;
  favorites: number;
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
export async function fetchMultipleVideoStats(youtubeIds: string[]): Promise<Map<string, VideoStats>> {
  if (youtubeIds.length === 0) return new Map();
  const token = await getAccessToken();
  const result = new Map<string, VideoStats>();
  const now = new Date().toISOString();

  // YouTube API allows up to 50 IDs per request
  for (let i = 0; i < youtubeIds.length; i += 50) {
    const chunk = youtubeIds.slice(i, i + 50);
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) {
      console.error('[fetchMultipleVideoStats] API error:', resp.status, await resp.text());
      continue;
    }
    const data = await resp.json();
    for (const item of data.items ?? []) {
      const s = item.statistics ?? {};
      result.set(item.id, {
        views:     parseInt(s.viewCount     ?? '0', 10),
        likes:     parseInt(s.likeCount     ?? '0', 10),
        comments:  parseInt(s.commentCount  ?? '0', 10),
        favorites: parseInt(s.favoriteCount ?? '0', 10),
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
