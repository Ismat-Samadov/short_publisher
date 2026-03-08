import { db, videos, topics } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { formatDistanceToNow, format } from 'date-fns';
import StatusBadge from '../../components/StatusBadge';
import { ExternalLink, Clock, Film, AlertCircle } from 'lucide-react';

async function getAllVideos() {
  return db
    .select({ video: videos, topic: topics })
    .from(videos)
    .leftJoin(topics, eq(videos.topic_id, topics.id))
    .orderBy(desc(videos.created_at));
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function VideoThumb({ status }: { status: string }) {
  const gradients: Record<string, string> = {
    published: 'linear-gradient(135deg, #065f46, #10b981)',
    failed: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
    generating: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
    uploading: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    pending: 'linear-gradient(135deg, #27272a, #52525b)',
  };
  const icons: Record<string, string> = {
    published: '▶',
    failed: '✕',
    generating: '⚙',
    uploading: '↑',
    pending: '·',
  };

  return (
    <div
      className="w-9 h-12 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-bold text-white/80"
      style={{ background: gradients[status] ?? gradients.pending }}
    >
      {icons[status] ?? '·'}
    </div>
  );
}

export default async function VideosPage() {
  const allVideos = await getAllVideos();

  const publishedCount = allVideos.filter(({ video }) => video.status === 'published').length;
  const failedCount = allVideos.filter(({ video }) => video.status === 'failed').length;
  const activeCount = allVideos.filter(
    ({ video }) => video.status === 'generating' || video.status === 'uploading'
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Videos</h1>
          <p className="text-zinc-500 text-sm mt-1">Complete history of all generated videos</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-950/60 border border-violet-800/60 text-violet-300">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-dot" />
              <span className="text-xs font-medium">{activeCount} active</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span><span className="text-emerald-400 font-semibold">{publishedCount}</span> published</span>
            <span className="text-zinc-800">·</span>
            <span><span className="text-red-400 font-semibold">{failedCount}</span> failed</span>
            <span className="text-zinc-800">·</span>
            <span><span className="text-zinc-300 font-semibold">{allVideos.length}</span> total</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {allVideos.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Film className="w-10 h-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">No videos yet</p>
            <p className="text-xs text-zinc-700">
              The pipeline will create videos automatically once topics are added.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Video', 'Status', 'Duration', 'YouTube', 'Created', 'Published'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allVideos.map(({ video, topic }) => (
                <tr
                  key={video.id}
                  className="group hover:bg-zinc-800/30 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  {/* Video title */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <VideoThumb status={video.status} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate max-w-[220px]">
                          {video.title ?? topic?.title ?? 'Untitled'}
                        </div>
                        {topic?.niche && (
                          <div className="text-[10px] text-zinc-600 mt-0.5">{topic.niche}</div>
                        )}
                        {video.error_message && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1 max-w-[220px] truncate">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {video.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={video.status} />
                  </td>

                  {/* Duration */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration_seconds)}
                    </span>
                  </td>

                  {/* YouTube */}
                  <td className="px-5 py-3.5">
                    {video.youtube_url ? (
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Watch
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-700">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs text-zinc-500"
                      title={format(new Date(video.created_at), 'PPpp')}
                    >
                      {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                    </span>
                  </td>

                  {/* Published */}
                  <td className="px-5 py-3.5">
                    {video.published_at ? (
                      <span
                        className="text-xs text-zinc-500"
                        title={format(new Date(video.published_at), 'PPpp')}
                      >
                        {formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
