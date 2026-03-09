/**
 * POST /api/videos/sync-stats
 * Fetches YouTube engagement stats for all published videos + channel stats.
 * Stores results in videos.metadata.engagement and returns a summary.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, videos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateSession } from '@/lib/auth';
import { fetchVideoStats, fetchChannelStats } from '@/lib/youtube-stats';

export async function POST(req: NextRequest) {
  if (!validateSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all published videos with a YouTube ID
    const published = await db
      .select({ id: videos.id, youtube_id: videos.youtube_id, metadata: videos.metadata })
      .from(videos)
      .where(eq(videos.status, 'published'));

    const withYtId = published.filter((v) => v.youtube_id);

    // Fetch channel stats once
    let channelStats = null;
    try {
      channelStats = await fetchChannelStats();
    } catch (e) {
      console.error('[sync-stats] Channel stats failed:', e);
    }

    // Fetch per-video stats in parallel
    const results = await Promise.allSettled(
      withYtId.map(async (video) => {
        const stats = await fetchVideoStats(video.youtube_id!);
        if (!stats) return { id: video.id, ok: false };

        const existing = (video.metadata ?? {}) as Record<string, unknown>;
        await db
          .update(videos)
          .set({ metadata: { ...existing, engagement: stats } })
          .where(eq(videos.id, video.id));

        return { id: video.id, ok: true, stats };
      })
    );

    const synced = results.filter((r) => r.status === 'fulfilled' && (r.value as { ok: boolean }).ok).length;

    return NextResponse.json({
      synced,
      total: withYtId.length,
      channel: channelStats,
    });
  } catch (error) {
    console.error('[POST /api/videos/sync-stats]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
