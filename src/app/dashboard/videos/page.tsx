'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import StatusBadge from '../../components/StatusBadge';
import {
  ExternalLink, Clock, Film, AlertCircle, DollarSign,
  RefreshCw, Eye, ThumbsUp, MessageCircle, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  topic?: { niche: string | null } | null;
}

interface ChannelStats {
  subscribers: number;
  total_views: number;
  video_count: number;
  synced_at: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

interface CostMeta {
  total_usd?: number;
  claude?: { cost_usd?: number; input_tokens?: number; output_tokens?: number };
  elevenlabs?: { cost_usd?: number; chars?: number };
  kling?: { cost_usd?: number; clips?: number };
}

function CostCell({ metadata }: { metadata: Record<string, unknown> | null }) {
  const cost = metadata as CostMeta | null;
  if (!cost?.total_usd) return <span className="text-xs text-zinc-700">—</span>;
  return (
    <div className="group relative inline-block">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 cursor-default">
        <DollarSign className="w-3 h-3" />
        {cost.total_usd.toFixed(2)}
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
  );
}

interface EngagementMeta {
  views?: number;
  likes?: number;
  comments?: number;
  synced_at?: string;
}

function EngagementCell({ metadata }: { metadata: Record<string, unknown> | null }) {
  const eng = (metadata?.engagement ?? null) as EngagementMeta | null;
  if (!eng?.synced_at) return <span className="text-xs text-zinc-700">—</span>;
  return (
    <div className="group relative inline-block">
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
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-36">
        <div className="rounded-lg p-2 text-[10px] text-zinc-500 shadow-xl" style={{ background: '#18181b', border: '1px solid #27272a' }}>
          Synced {formatDistanceToNow(new Date(eng.synced_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

function VideoThumb({ status }: { status: string }) {
  const gradients: Record<string, string> = {
    published: 'linear-gradient(135deg, #065f46, #10b981)',
    failed: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
    generating: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
    uploading: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    pending: 'linear-gradient(135deg, #27272a, #52525b)',
  };
  const icons: Record<string, string> = { published: '▶', failed: '✕', generating: '⚙', uploading: '↑', pending: '·' };
  return (
    <div className="w-9 h-12 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-bold text-white/80"
      style={{ background: gradients[status] ?? gradients.pending }}>
      {icons[status] ?? '·'}
    </div>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const raw: { video: Video; topic: { niche: string | null } | null }[] = await res.json();
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
      if (!res.ok) {
        setSyncMsg(data.error ?? 'Sync failed');
        return;
      }
      if (data.channel) setChannelStats(data.channel);
      setSyncMsg(`Synced ${data.synced}/${data.total} videos`);
      await fetchVideos();
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 5000);
    }
  }

  const publishedCount = videos.filter((v) => v.status === 'published').length;
  const failedCount    = videos.filter((v) => v.status === 'failed').length;
  const totalSpent     = videos.reduce((sum, v) => {
    const cost = v.metadata as CostMeta | null;
    return sum + (cost?.total_usd ?? 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Videos</h1>
          <p className="text-zinc-500 text-sm mt-1">Complete history of all generated videos</p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && (
            <span className="text-xs text-zinc-500">{syncMsg}</span>
          )}
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin-slow')} />
            Refresh
          </button>
          <button
            onClick={syncStats}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {syncing
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              : <Eye className="w-3.5 h-3.5" />}
            Sync Stats
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span><span className="text-emerald-400 font-semibold">{publishedCount}</span> published</span>
          <span className="text-zinc-800">·</span>
          <span><span className="text-red-400 font-semibold">{failedCount}</span> failed</span>
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

        {/* Channel stats chip */}
        {channelStats && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs border ml-auto"
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

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin-slow" />
            <p className="text-sm text-zinc-600">Loading videos…</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Film className="w-10 h-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">No videos yet</p>
            <p className="text-xs text-zinc-700">The pipeline will create videos automatically once topics are added.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Video', 'Status', 'Duration', 'Cost', 'Engagement', 'YouTube', 'Published'].map((h) => (
                  <th key={h} className="text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="group hover:bg-zinc-800/30 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Title */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <VideoThumb status={video.status as string} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">
                          {video.title ?? 'Untitled'}
                        </div>
                        {video.topic?.niche && (
                          <div className="text-[10px] text-zinc-600 mt-0.5">{video.topic.niche}</div>
                        )}
                        {video.error_message && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1 max-w-[200px] truncate">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {video.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3.5"><StatusBadge status={video.status as Parameters<typeof StatusBadge>[0]['status']} /></td>
                  {/* Duration */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="w-3 h-3" />{formatDuration(video.duration_seconds)}
                    </span>
                  </td>
                  {/* Cost */}
                  <td className="px-5 py-3.5"><CostCell metadata={video.metadata} /></td>
                  {/* Engagement */}
                  <td className="px-5 py-3.5"><EngagementCell metadata={video.metadata} /></td>
                  {/* YouTube */}
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
                  {/* Published */}
                  <td className="px-5 py-3.5">
                    {video.published_at ? (
                      <span className="text-xs text-zinc-500" title={format(new Date(video.published_at), 'PPpp')}>
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
