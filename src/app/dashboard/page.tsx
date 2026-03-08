import { db, videos, topics } from '@/lib/db/schema';
import { desc, eq, gte, count, and } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import StatusBadge from '../components/StatusBadge';
import { Video, ListTodo, CheckCircle2, TrendingUp, ExternalLink, ArrowRight, PlayCircle } from 'lucide-react';

async function getStats() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalPublished] = await db
    .select({ count: count() })
    .from(videos)
    .where(eq(videos.status, 'published'));

  const [thisWeek] = await db
    .select({ count: count() })
    .from(videos)
    .where(and(eq(videos.status, 'published'), gte(videos.published_at, oneWeekAgo)));

  const [queuedTopics] = await db
    .select({ count: count() })
    .from(topics)
    .where(eq(topics.status, 'queued'));

  const [totalVideos] = await db.select({ count: count() }).from(videos);
  const [failedVideos] = await db
    .select({ count: count() })
    .from(videos)
    .where(eq(videos.status, 'failed'));

  const total = totalVideos.count;
  const failed = failedVideos.count;
  const successRate = total > 0 ? Math.round(((total - failed) / total) * 100) : 0;

  return {
    totalPublished: totalPublished.count,
    thisWeek: thisWeek.count,
    queuedTopics: queuedTopics.count,
    successRate,
    total,
    failed,
  };
}

async function getRecentVideos() {
  return db
    .select({ video: videos, topic: topics })
    .from(videos)
    .leftJoin(topics, eq(videos.topic_id, topics.id))
    .orderBy(desc(videos.created_at))
    .limit(8);
}

async function getQueuePreview() {
  return db
    .select()
    .from(topics)
    .where(eq(topics.status, 'queued'))
    .orderBy(desc(topics.priority))
    .limit(3);
}

const statCards = (stats: Awaited<ReturnType<typeof getStats>>) => [
  {
    label: 'Total Published',
    value: stats.totalPublished,
    sub: 'all time',
    icon: Video,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    label: 'Published This Week',
    value: stats.thisWeek,
    sub: 'last 7 days',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    label: 'Topics in Queue',
    value: stats.queuedTopics,
    sub: 'ready to generate',
    icon: ListTodo,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    label: 'Success Rate',
    value: `${stats.successRate}%`,
    sub: `${stats.failed} failed of ${stats.total}`,
    icon: CheckCircle2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
];

export default async function DashboardPage() {
  const [stats, recentVideos, queuePreview] = await Promise.all([
    getStats(),
    getRecentVideos(),
    getQueuePreview(),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Your YouTube Shorts automation pipeline at a glance
          </p>
        </div>
        <Link
          href="/dashboard/pipeline"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent transition-opacity hover:opacity-90 glow-accent"
        >
          <PlayCircle className="w-4 h-4" />
          Go to Pipeline
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards(stats).map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`rounded-xl p-5 border ${border} flex flex-col gap-3`}
            style={{ background: 'var(--surface)' }}
          >
            <div className={`w-9 h-9 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-100">{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
              <div className="text-[10px] text-zinc-700 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: 2 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Videos — 2/3 width */}
        <div
          className="lg:col-span-2 rounded-xl border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-semibold text-zinc-200">Recent Videos</h2>
            <Link
              href="/dashboard/videos"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentVideos.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Video className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">No videos yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Add topics and trigger the pipeline to get started.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {recentVideos.map(({ video, topic }) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Color thumb */}
                  <div
                    className="w-8 h-10 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      background:
                        video.status === 'published'
                          ? 'linear-gradient(135deg, #059669, #10b981)'
                          : video.status === 'failed'
                          ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                          : video.status === 'generating' || video.status === 'uploading'
                          ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                          : 'linear-gradient(135deg, #3f3f46, #52525b)',
                    }}
                  >
                    {video.status === 'published' ? '▶' : video.status === 'failed' ? '✕' : '…'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-200 truncate">
                      {video.title ?? topic?.title ?? 'Untitled'}
                    </div>
                    <div className="text-xs text-zinc-600 mt-0.5">
                      {topic?.niche && <span className="mr-2">{topic.niche}</span>}
                      {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={video.status} />
                    {video.youtube_url && (
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-4">
          {/* Upcoming Queue */}
          <div
            className="rounded-xl border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2 className="text-sm font-semibold text-zinc-200">Next in Queue</h2>
              <Link
                href="/dashboard/topics"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Manage
              </Link>
            </div>

            {queuePreview.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <ListTodo className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Queue is empty</p>
                <Link
                  href="/dashboard/topics"
                  className="text-xs text-violet-400 hover:text-violet-300 mt-1 block"
                >
                  Add topics →
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {queuePreview.map((topic, i) => (
                  <div key={topic.id} className="px-5 py-3 flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: 'var(--border)', color: 'var(--muted-fg)' }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-300 truncate">{topic.title}</div>
                      {topic.niche && (
                        <div className="text-[10px] text-zinc-600 mt-0.5">{topic.niche}</div>
                      )}
                    </div>
                    {topic.priority > 0 && (
                      <div className="flex-shrink-0 text-[10px] text-amber-500 font-medium">
                        P{topic.priority}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div
            className="rounded-xl border p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/topics"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <ListTodo className="w-3.5 h-3.5" />
                  Add new topics
                </span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/dashboard/pipeline"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Trigger pipeline run
                </span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Configure settings
                </span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
