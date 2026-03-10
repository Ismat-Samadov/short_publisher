'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { formatDistanceToNow, format, getDay, getHours } from 'date-fns';
import StatusBadge from '../../components/StatusBadge';
import {
  ExternalLink, Clock, Film, AlertCircle, DollarSign,
  RefreshCw, Eye, ThumbsUp, MessageCircle, Users, Pencil, Check, X,
  TrendingUp, Calendar, Tag, Zap, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EngagementMeta {
  views?: number;
  likes?: number;
  comments?: number;
  favorites?: number;
  engagement_rate?: number;
  like_rate?: number;
  comment_rate?: number;
  views_per_day?: number;
  yt_published_at?: string | null;
  yt_tags?: string[];
  yt_category_id?: string | null;
  yt_duration?: string | null;
  yt_duration_seconds?: number | null;
  yt_definition?: string | null;
  synced_at?: string;
}

interface CostMeta {
  total_usd?: number;
  claude?: { cost_usd?: number; input_tokens?: number; output_tokens?: number };
  elevenlabs?: { cost_usd?: number; chars?: number };
  kling?: { cost_usd?: number; clips?: number };
}

interface Video {
  id: string;
  title: string | null;
  youtube_url: string | null;
  youtube_id: string | null;
  duration_seconds: number | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  published_at: string | null;
  topic?: { niche: string | null; title?: string | null } | null;
}

interface ChannelStats {
  subscribers: number;
  total_views: number;
  video_count: number;
  synced_at: string;
}

type FilterTab = 'all' | 'published' | 'failed';

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ── Cost Cell ─────────────────────────────────────────────────────────────────

function CostCell({
  videoId,
  metadata,
  onSaved,
}: {
  videoId: string;
  metadata: Record<string, unknown> | null;
  onSaved: (updated: Record<string, unknown>) => void;
}) {
  const cost = metadata as CostMeta | null;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({ total: '', claude: '', elevenlabs: '', kling: '' });

  function openEditor() {
    setFields({
      total:      String(cost?.total_usd ?? ''),
      claude:     String(cost?.claude?.cost_usd ?? ''),
      elevenlabs: String(cost?.elevenlabs?.cost_usd ?? ''),
      kling:      String(cost?.kling?.cost_usd ?? ''),
    });
    setEditing(true);
  }

  async function save() {
    const total = parseFloat(fields.total);
    if (isNaN(total) || total < 0) return;
    setSaving(true);
    try {
      const costPayload: CostMeta = {
        total_usd:  total,
        claude:     { ...(cost?.claude ?? {}),     cost_usd: parseFloat(fields.claude) || 0 },
        elevenlabs: { ...(cost?.elevenlabs ?? {}), cost_usd: parseFloat(fields.elevenlabs) || 0 },
        kling:      { ...(cost?.kling ?? {}),      cost_usd: parseFloat(fields.kling) || 0 },
      };
      const res = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost: costPayload }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved(updated.metadata);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 py-1 min-w-[130px]">
        {([['Total', 'total'], ['Claude', 'claude'], ['ElevenLabs', 'elevenlabs'], ['Kling', 'kling']] as const).map(([label, key]) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-600 w-16 flex-shrink-0">{label}</span>
            <input
              type="number" step="0.0001" min="0"
              value={fields[key]}
              onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full text-[11px] rounded px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-violet-500"
            />
          </div>
        ))}
        <div className="flex items-center gap-1 mt-0.5">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors">
            {saving ? <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> : <Check className="w-2.5 h-2.5" />}
            Save
          </button>
          <button onClick={() => setEditing(false)} className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/cost relative inline-flex items-center gap-1.5">
      {cost?.total_usd ? (
        <div className="group relative inline-block">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 cursor-default">
            <DollarSign className="w-3 h-3" />{cost.total_usd.toFixed(2)}
          </span>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-44">
            <div className="rounded-lg p-2.5 text-[10px] space-y-1 shadow-xl" style={{ background: '#18181b', border: '1px solid #27272a' }}>
              <div className="flex justify-between text-zinc-400">
                <span>Claude</span><span>${cost.claude?.cost_usd?.toFixed(4) ?? '—'}</span>
              </div>
              {cost.claude?.input_tokens && (
                <div className="text-zinc-600 pl-2">{cost.claude.input_tokens}↑ / {cost.claude.output_tokens}↓ tok</div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>ElevenLabs</span><span>${cost.elevenlabs?.cost_usd?.toFixed(4) ?? '—'}</span>
              </div>
              {cost.elevenlabs?.chars && (
                <div className="text-zinc-600 pl-2">{cost.elevenlabs.chars} chars</div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Kling ({cost.kling?.clips ?? 0} clips)</span><span>${cost.kling?.cost_usd?.toFixed(4) ?? '—'}</span>
              </div>
              <div className="flex justify-between text-zinc-200 font-semibold border-t pt-1" style={{ borderColor: '#27272a' }}>
                <span>Total</span><span>${cost.total_usd.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <span className="text-xs text-zinc-700">—</span>
      )}
      <button onClick={openEditor}
        className="opacity-0 group-hover/cost:opacity-100 p-0.5 text-zinc-700 hover:text-violet-400 transition-all rounded" title="Edit cost">
        <Pencil className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ── Engagement Cell ───────────────────────────────────────────────────────────

function EngagementCell({ metadata }: { metadata: Record<string, unknown> | null }) {
  const eng = (metadata?.engagement ?? null) as EngagementMeta | null;
  if (!eng?.synced_at) return <span className="text-xs text-zinc-700">—</span>;

  const engRate = eng.engagement_rate ?? 0;
  const rateColor = engRate >= 5 ? 'text-emerald-400' : engRate >= 2 ? 'text-yellow-400' : 'text-zinc-500';

  return (
    <div className="group relative inline-block">
      <div className="flex flex-col gap-1">
        {/* Main counts */}
        <div className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-default">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-blue-400" />{fmt(eng.views ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-emerald-400" />{fmt(eng.likes ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3 text-violet-400" />{fmt(eng.comments ?? 0)}
          </span>
        </div>
        {/* Engagement rate + velocity */}
        <div className="flex items-center gap-2">
          {engRate > 0 && (
            <span className={cn('text-[10px] font-medium', rateColor)}>
              {engRate.toFixed(2)}% eng
            </span>
          )}
          {(eng.views_per_day ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-600">
              <Zap className="w-2.5 h-2.5" />{fmt(eng.views_per_day!)}/day
            </span>
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 w-52">
        <div className="rounded-lg p-3 text-[10px] space-y-1.5 shadow-xl" style={{ background: '#18181b', border: '1px solid #27272a' }}>
          <div className="flex justify-between text-zinc-300 font-medium border-b pb-1.5" style={{ borderColor: '#27272a' }}>
            <span>Engagement breakdown</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Views</span><span className="text-blue-400 font-medium">{fmt(eng.views ?? 0)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Likes</span><span className="text-emerald-400 font-medium">{fmt(eng.likes ?? 0)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Comments</span><span className="text-violet-400 font-medium">{fmt(eng.comments ?? 0)}</span>
          </div>
          <div className="border-t pt-1.5" style={{ borderColor: '#27272a' }}>
            <div className="flex justify-between text-zinc-400">
              <span>Engagement rate</span><span className={rateColor}>{engRate.toFixed(3)}%</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Like rate</span><span>{(eng.like_rate ?? 0).toFixed(3)}%</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Comment rate</span><span>{(eng.comment_rate ?? 0).toFixed(3)}%</span>
            </div>
            {(eng.views_per_day ?? 0) > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Views / day</span><span className="text-zinc-300">{fmt(eng.views_per_day!)}</span>
              </div>
            )}
          </div>
          {eng.yt_tags && eng.yt_tags.length > 0 && (
            <div className="border-t pt-1.5" style={{ borderColor: '#27272a' }}>
              <div className="text-zinc-600 mb-1">Tags</div>
              <div className="flex flex-wrap gap-1">
                {eng.yt_tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="px-1 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-500">{tag}</span>
                ))}
                {eng.yt_tags.length > 5 && (
                  <span className="text-[9px] text-zinc-700">+{eng.yt_tags.length - 5} more</span>
                )}
              </div>
            </div>
          )}
          <div className="text-zinc-700 pt-0.5">
            Synced {formatDistanceToNow(new Date(eng.synced_at!), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Publish Time Cell ─────────────────────────────────────────────────────────

function PublishTimeCell({ video }: { video: Video }) {
  const eng = (video.metadata?.engagement ?? null) as EngagementMeta | null;

  // Prefer actual YouTube publish time (from snippet), fall back to DB published_at
  const publishDateStr = eng?.yt_published_at ?? video.published_at;
  if (!publishDateStr) return <span className="text-xs text-zinc-700">—</span>;

  const date = new Date(publishDateStr);
  const dayName = DAY_NAMES[getDay(date)];
  const hour = getHours(date);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return (
    <div className="group relative inline-block">
      <div className="flex flex-col cursor-default">
        <span className="text-xs text-zinc-400 font-medium">
          {format(date, 'MMM d, yyyy')}
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-zinc-600">{dayName}</span>
          <span className="text-[10px] text-zinc-700">·</span>
          <span className="text-[10px] text-zinc-600">{hour12}{ampm}</span>
          {eng?.yt_duration_seconds && (
            <>
              <span className="text-[10px] text-zinc-700">·</span>
              <span className="text-[10px] text-zinc-600">{formatDuration(eng.yt_duration_seconds)}</span>
            </>
          )}
        </div>
      </div>
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 w-44">
        <div className="rounded-lg p-2.5 text-[10px] space-y-1 shadow-xl" style={{ background: '#18181b', border: '1px solid #27272a' }}>
          <div className="flex justify-between text-zinc-400">
            <span>YT publish time</span>
            <span className="text-zinc-300">{format(date, 'HH:mm')} UTC</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Day</span><span className="text-zinc-300">{DAY_NAMES[getDay(date)]}</span>
          </div>
          {eng?.yt_definition && (
            <div className="flex justify-between text-zinc-400">
              <span>Quality</span><span className="text-zinc-300 uppercase">{eng.yt_definition}</span>
            </div>
          )}
          {video.published_at && eng?.yt_published_at && (
            <div className="text-zinc-700 border-t pt-1" style={{ borderColor: '#27272a' }}>
              Pipeline: {format(new Date(video.published_at), 'HH:mm')} UTC
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Video Thumbnail ───────────────────────────────────────────────────────────

function VideoThumb({ status }: { status: string }) {
  const gradients: Record<string, string> = {
    published:  'linear-gradient(135deg, #065f46, #10b981)',
    failed:     'linear-gradient(135deg, #7f1d1d, #ef4444)',
    generating: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
    uploading:  'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    pending:    'linear-gradient(135deg, #27272a, #52525b)',
  };
  const icons: Record<string, string> = { published: '▶', failed: '✕', generating: '⚙', uploading: '↑', pending: '·' };
  return (
    <div className="w-9 h-12 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-bold text-white/80"
      style={{ background: gradients[status] ?? gradients.pending }}>
      {icons[status] ?? '·'}
    </div>
  );
}

// ── Insight Cards ─────────────────────────────────────────────────────────────

function InsightCards({ videos }: { videos: Video[] }) {
  const published = videos.filter((v) => v.status === 'published');

  // Best day of week by avg engagement rate
  const byDay = Array.from({ length: 7 }, (_, i) => ({ day: i, rates: [] as number[] }));
  // Best hour by avg views/day
  const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, vpd: [] as number[] }));

  for (const v of published) {
    const eng = v.metadata?.engagement as EngagementMeta | null;
    if (!eng) continue;
    const dateStr = eng.yt_published_at ?? v.published_at;
    if (!dateStr) continue;
    const d = new Date(dateStr);
    if (eng.engagement_rate) byDay[getDay(d)].rates.push(eng.engagement_rate);
    if (eng.views_per_day)   byHour[getHours(d)].vpd.push(eng.views_per_day);
  }

  const bestDay = byDay
    .filter((d) => d.rates.length > 0)
    .sort((a, b) => avg(b.rates) - avg(a.rates))[0];

  const bestHour = byHour
    .filter((h) => h.vpd.length > 0)
    .sort((a, b) => avg(b.vpd) - avg(a.vpd))[0];

  // Best niche by avg engagement rate
  const byNiche: Record<string, number[]> = {};
  for (const v of published) {
    const eng = v.metadata?.engagement as EngagementMeta | null;
    const niche = v.topic?.niche ?? 'Unknown';
    if (!byNiche[niche]) byNiche[niche] = [];
    if (eng?.engagement_rate) byNiche[niche].push(eng.engagement_rate);
  }
  const bestNiche = Object.entries(byNiche)
    .filter(([, rates]) => rates.length > 0)
    .sort(([, a], [, b]) => avg(b) - avg(a))[0];

  // Avg engagement rate across all published
  const allRates = published.flatMap((v) => {
    const e = v.metadata?.engagement as EngagementMeta | null;
    return e?.engagement_rate ? [e.engagement_rate] : [];
  });

  const hasData = allRates.length > 0;
  if (!hasData) return null;

  const h = bestHour?.hour ?? 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <InsightCard
        icon={<BarChart2 className="w-3.5 h-3.5 text-violet-400" />}
        label="Avg engagement rate"
        value={`${avg(allRates).toFixed(2)}%`}
        sub={`across ${allRates.length} videos`}
      />
      {bestDay && (
        <InsightCard
          icon={<Calendar className="w-3.5 h-3.5 text-blue-400" />}
          label="Best publish day"
          value={DAY_NAMES[bestDay.day]}
          sub={`${avg(bestDay.rates).toFixed(2)}% avg eng`}
        />
      )}
      {bestHour && (
        <InsightCard
          icon={<Clock className="w-3.5 h-3.5 text-yellow-400" />}
          label="Best publish hour"
          value={`${h12}${ampm} UTC`}
          sub={`${fmt(Math.round(avg(bestHour.vpd)))} views/day avg`}
        />
      )}
      {bestNiche && (
        <InsightCard
          icon={<Tag className="w-3.5 h-3.5 text-emerald-400" />}
          label="Top niche"
          value={bestNiche[0]}
          sub={`${avg(bestNiche[1]).toFixed(2)}% avg eng`}
        />
      )}
    </div>
  );
}

function InsightCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold text-zinc-100 leading-tight">{value}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>
    </div>
  );
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [syncMsg, setSyncMsg] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const raw: { video: Video; topic: { niche: string | null; title?: string | null } | null }[] = await res.json();
        setVideos(raw.map(({ video, topic }) => ({ ...video, topic })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  async function syncStats() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/videos/sync-stats', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setSyncMsg(data.error ?? 'Sync failed'); return; }
      if (data.channel) setChannelStats(data.channel);
      setSyncMsg(`Synced ${data.synced}/${data.total} videos`);
      await fetchVideos();
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 5000);
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'published') return videos.filter((v) => v.status === 'published');
    if (filter === 'failed')    return videos.filter((v) => v.status === 'failed');
    return videos;
  }, [videos, filter]);

  const publishedCount = videos.filter((v) => v.status === 'published').length;
  const failedCount    = videos.filter((v) => v.status === 'failed').length;
  const totalSpent     = videos.reduce((sum, v) => sum + ((v.metadata as CostMeta | null)?.total_usd ?? 0), 0);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all',       label: 'All',       count: videos.length },
    { id: 'published', label: 'Published', count: publishedCount },
    { id: 'failed',    label: 'Failed',    count: failedCount },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Videos</h1>
          <p className="text-zinc-500 text-sm mt-1">Complete history — sync stats to analyze engagement patterns</p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-xs text-zinc-500">{syncMsg}</span>}
          <button onClick={fetchVideos} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin-slow')} />
            Refresh
          </button>
          <button onClick={syncStats} disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50">
            {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> : <TrendingUp className="w-3.5 h-3.5" />}
            Sync Stats
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span><span className="text-emerald-400 font-semibold">{publishedCount}</span> published</span>
          {failedCount > 0 && (
            <>
              <span className="text-zinc-800">·</span>
              <span><span className="text-red-400 font-semibold">{failedCount}</span> failed</span>
            </>
          )}
          <span className="text-zinc-800">·</span>
          <span><span className="text-zinc-300 font-semibold">{videos.length}</span> total</span>
          {totalSpent > 0 && (
            <>
              <span className="text-zinc-800">·</span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-400 font-semibold">{totalSpent.toFixed(2)}</span>
                <span>spent</span>
              </span>
            </>
          )}
        </div>
        {channelStats && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <span className="flex items-center gap-1 text-zinc-400">
              <Users className="w-3 h-3 text-red-400" />
              <span className="font-semibold text-zinc-200">{fmt(channelStats.subscribers)}</span> subs
            </span>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Eye className="w-3 h-3 text-blue-400" />
              <span className="font-semibold text-zinc-200">{fmt(channelStats.total_views)}</span> total views
            </span>
          </div>
        )}
      </div>

      {/* Pattern insight cards */}
      <InsightCards videos={videos} />

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === tab.id
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            )}>
            {tab.label}
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
              filter === tab.id ? 'bg-zinc-600 text-zinc-200' : 'bg-zinc-800 text-zinc-600'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin-slow" />
            <p className="text-sm text-zinc-600">Loading videos…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Film className="w-10 h-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">No videos in this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Video', icon: null },
                    { label: 'Status', icon: null },
                    { label: 'Cost', icon: <DollarSign className="w-3 h-3" /> },
                    { label: 'Engagement', icon: <TrendingUp className="w-3 h-3" /> },
                    { label: 'Published', icon: <Calendar className="w-3 h-3" /> },
                    { label: 'YouTube', icon: null },
                  ].map(({ label, icon }) => (
                    <th key={label} className="text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider px-5 py-3">
                      <span className="flex items-center gap-1">{icon}{label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((video) => (
                  <tr key={video.id} className="group hover:bg-zinc-800/30 transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}>

                    {/* Title + niche */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <VideoThumb status={video.status} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate max-w-[220px]" title={video.title ?? undefined}>
                            {video.title ?? 'Untitled'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {video.topic?.niche && (
                              <span className="text-[10px] text-zinc-600">{video.topic.niche}</span>
                            )}
                            {video.duration_seconds && (
                              <span className="flex items-center gap-0.5 text-[10px] text-zinc-700">
                                <Clock className="w-2.5 h-2.5" />{formatDuration(video.duration_seconds)}
                              </span>
                            )}
                          </div>
                          {video.error_message && (
                            <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1 max-w-[220px] truncate" title={video.error_message}>
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              {video.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={video.status as Parameters<typeof StatusBadge>[0]['status']} />
                    </td>

                    {/* Cost */}
                    <td className="px-5 py-3.5">
                      <CostCell
                        videoId={video.id}
                        metadata={video.metadata}
                        onSaved={(updated) =>
                          setVideos((prev) => prev.map((v) => v.id === video.id ? { ...v, metadata: updated } : v))
                        }
                      />
                    </td>

                    {/* Engagement */}
                    <td className="px-5 py-3.5">
                      <EngagementCell metadata={video.metadata} />
                    </td>

                    {/* Publish time */}
                    <td className="px-5 py-3.5">
                      <PublishTimeCell video={video} />
                    </td>

                    {/* YouTube link */}
                    <td className="px-5 py-3.5">
                      {video.youtube_url ? (
                        <a href={video.youtube_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
                          <ExternalLink className="w-3 h-3" />Watch
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-700">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
