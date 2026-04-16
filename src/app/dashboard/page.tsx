export const dynamic = 'force-dynamic';

import { db, videos, topics, settings } from '@/lib/db/schema';
import { desc, eq, gte, count, and } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import StatusBadge from '../components/StatusBadge';
import {
  Video,
  ListTodo,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ArrowRight,
  PlayCircle,
  Zap,
  Clock,
} from 'lucide-react';

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

  return { totalPublished: totalPublished.count, thisWeek: thisWeek.count, queuedTopics: queuedTopics.count, successRate, total, failed };
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
    .limit(4);
}

async function getScheduleEnabled(): Promise<boolean> {
  const row = await db.select().from(settings).where(eq(settings.key, 'schedule_enabled')).limit(1);
  return row.length === 0 || row[0].value !== 'false';
}

export default async function DashboardPage() {
  const [stats, recentVideos, queuePreview, scheduleEnabled] = await Promise.all([
    getStats(),
    getRecentVideos(),
    getQueuePreview(),
    getScheduleEnabled(),
  ]);

  const statCards = [
    {
      label: 'Total Published',
      value: stats.totalPublished,
      sub: 'all time',
      icon: Video,
      accent: '#8b5cf6',
      accentBg: 'rgba(139,92,246,0.08)',
      accentBorder: 'rgba(139,92,246,0.2)',
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      sub: 'last 7 days',
      icon: TrendingUp,
      accent: '#10b981',
      accentBg: 'rgba(16,185,129,0.08)',
      accentBorder: 'rgba(16,185,129,0.2)',
    },
    {
      label: 'In Queue',
      value: stats.queuedTopics,
      sub: 'ready to generate',
      icon: ListTodo,
      accent: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.08)',
      accentBorder: 'rgba(245,158,11,0.2)',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      sub: `${stats.total - stats.failed} of ${stats.total} succeeded`,
      icon: CheckCircle2,
      accent: '#3b82f6',
      accentBg: 'rgba(59,130,246,0.08)',
      accentBorder: 'rgba(59,130,246,0.2)',
    },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest">Overview</span>
          </div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/pipeline"
            className={
              scheduleEnabled
                ? 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-300 border border-emerald-800/50 bg-emerald-950/40'
                : 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-red-400 border border-red-800/50 bg-red-950/40'
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${scheduleEnabled ? 'bg-emerald-400 animate-pulse-dot' : 'bg-red-500'}`} />
            {scheduleEnabled ? 'Auto-publish on' : 'Auto-publish off'}
          </Link>
          <Link
            href="/dashboard/pipeline"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white gradient-accent glow-accent hover:opacity-90 transition-opacity"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Run Pipeline
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, sub, icon: Icon, accent, accentBg, accentBorder }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-md"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Top border accent */}
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-xl"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }}
            />
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
            </div>
            <div>
              <div className="text-[26px] font-bold text-zinc-100 leading-none">{value}</div>
              <div className="text-xs font-medium text-zinc-400 mt-1">{label}</div>
              <div className="text-[10px] text-zinc-700 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Recent Videos — 2/3 */}
        <div
          className="md:col-span-2 rounded-xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-sm font-semibold text-zinc-200">Recent Videos</span>
            </div>
            <Link
              href="/dashboard/videos"
              className="flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentVideos.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-3">
                <Video className="w-5 h-5 text-zinc-700" />
              </div>
              <p className="text-sm font-medium text-zinc-500">No videos yet</p>
              <p className="text-xs text-zinc-700 mt-1">Add topics and trigger the pipeline.</p>
            </div>
          ) : (
            <div>
              {recentVideos.map(({ video, topic }, idx) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: idx < recentVideos.length - 1 ? '1px solid var(--border)' : undefined }}
                >
                  {/* Status pill */}
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{
                      background:
                        video.status === 'published' ? '#10b981'
                        : video.status === 'failed' ? '#ef4444'
                        : video.status === 'generating' || video.status === 'uploading' ? '#8b5cf6'
                        : '#3f3f46',
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-zinc-200 truncate leading-tight">
                      {video.title ?? topic?.title ?? 'Untitled'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {topic?.niche && (
                        <span className="text-[10px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                          {topic.niche}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-700">
                        {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <StatusBadge status={video.status} />
                    {video.youtube_url && (
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-zinc-700 hover:text-violet-400 transition-colors rounded"
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

        {/* Right column — 1/3 */}
        <div className="space-y-4">

          {/* Next in Queue */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-sm font-semibold text-zinc-200">Queue</span>
                {stats.queuedTopics > 0 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                    {stats.queuedTopics}
                  </span>
                )}
              </div>
              <Link
                href="/dashboard/topics"
                className="text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                Manage
              </Link>
            </div>

            {queuePreview.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-zinc-600">Queue is empty</p>
                <Link href="/dashboard/topics" className="text-xs text-violet-400 hover:text-violet-300 mt-1 block">
                  Add topics →
                </Link>
              </div>
            ) : (
              <div>
                {queuePreview.map((topic, i) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < queuePreview.length - 1 ? '1px solid var(--border)' : undefined }}
                  >
                    <span
                      className="text-[10px] font-bold w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--surface-3)', color: 'var(--muted-fg)' }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-zinc-300 truncate">{topic.title}</div>
                      {topic.niche && (
                        <div className="text-[10px] text-zinc-600 mt-0.5">{topic.niche}</div>
                      )}
                    </div>
                    {topic.priority > 0 && (
                      <span className="text-[10px] text-amber-500 font-semibold flex-shrink-0">
                        P{topic.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-sm font-semibold text-zinc-200">Quick Actions</span>
            </div>
            <div className="space-y-1">
              {[
                { href: '/dashboard/topics', label: 'Add new topics', icon: ListTodo },
                { href: '/dashboard/pipeline', label: 'Trigger pipeline', icon: PlayCircle },
                { href: '/dashboard/settings', label: 'Configure settings', icon: Clock },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-[12px] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3 h-3 group-hover:text-violet-400 transition-colors" />
                    {label}
                  </span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
