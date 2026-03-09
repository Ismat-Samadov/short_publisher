'use client';

import { useState } from 'react';
import {
  PlayCircle,
  ExternalLink,
  RefreshCw,
  Calendar,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowRun {
  id: number;
  name: string;
  status: 'completed' | 'in_progress' | 'queued' | 'waiting';
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  run_number: number;
  event: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_started_at: string;
}

function RunStatusIcon({ run }: { run: WorkflowRun }) {
  if (run.status === 'in_progress' || run.status === 'queued') {
    return <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />;
  }
  if (run.conclusion === 'success') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (run.conclusion === 'failure') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (run.conclusion === 'cancelled') return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
  return <Clock className="w-3.5 h-3.5 text-zinc-500" />;
}

function RunStatusBadge({ run }: { run: WorkflowRun }) {
  if (run.status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
        Running
      </span>
    );
  }
  if (run.status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot" />
        Queued
      </span>
    );
  }
  if (run.conclusion === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Success
      </span>
    );
  }
  if (run.conclusion === 'failure') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-950/60 text-red-300 border border-red-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
      {run.conclusion ?? run.status}
    </span>
  );
}

function formatDuration(start: string, end: string): string {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m ${diff % 60}s`;
}

const pipelineSteps = [
  { step: 1, label: 'Fetch Topic', sub: 'NeonDB', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  { step: 2, label: 'Script', sub: 'Claude Sonnet', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
  { step: 3, label: 'Voiceover', sub: 'ElevenLabs', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  { step: 4, label: 'Video Clips', sub: 'Kling 2.5 Pro', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
  { step: 5, label: 'Assemble', sub: 'FFmpeg', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  { step: 6, label: 'Archive', sub: 'Cloudflare R2', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  { step: 7, label: 'Publish', sub: 'YouTube API', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  { step: 8, label: 'Notify', sub: 'Telegram', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
];

export default function PipelinePage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [fetched, setFetched] = useState(false);

  async function fetchRuns() {
    setLoading(true);
    setFetched(true);
    try {
      const res = await fetch('/api/pipeline/runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function triggerRun(dryRun: boolean) {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/pipeline/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: dryRun }),
      });
      const data = await res.json();
      setTriggerResult(
        res.ok
          ? { ok: true, message: 'Pipeline triggered — check GitHub Actions for live progress.' }
          : { ok: false, message: data.error ?? 'Failed to trigger pipeline.' }
      );
      if (res.ok) setTimeout(() => fetchRuns(), 3000);
    } catch {
      setTriggerResult({ ok: false, message: 'Network error. Verify GH_TOKEN is configured.' });
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-1">Automation</div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Pipeline</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerRun(true)}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-all disabled:opacity-40"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Dry Run
          </button>
          <button
            onClick={() => triggerRun(false)}
            disabled={triggering}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white gradient-accent glow-accent hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {triggering ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5" />
            )}
            {triggering ? 'Triggering…' : 'Trigger Now'}
          </button>
        </div>
      </div>

      {/* Trigger result */}
      {triggerResult && (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm animate-fade-in',
            triggerResult.ok
              ? 'text-emerald-300 border-emerald-800/50'
              : 'text-red-300 border-red-800/50'
          )}
          style={{ background: triggerResult.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}
        >
          {triggerResult.ok
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <XCircle className="w-4 h-4 flex-shrink-0" />}
          {triggerResult.message}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: Calendar, iconColor: 'text-violet-400',
            label: 'Schedule', value: 'Daily',
            sub: '09:00 UTC every day',
            note: 'cron: 0 9 * * *',
          },
          {
            icon: Clock, iconColor: 'text-blue-400',
            label: 'Avg Duration', value: '~8 min',
            sub: 'script → audio → visuals → assemble',
            note: '45 min GitHub Actions timeout',
          },
          {
            icon: Activity, iconColor: 'text-emerald-400',
            label: 'Free Minutes', value: '2,000',
            sub: 'per month on GitHub Free',
            note: '≈ 250 pipeline runs / mo',
          },
        ].map(({ icon: Icon, iconColor, label, value, sub, note }) => (
          <div
            key={label}
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-3', 'bg-zinc-800/60')}>
              <Icon className={cn('w-3.5 h-3.5', iconColor)} />
            </div>
            <div className="text-[22px] font-bold text-zinc-100 leading-none">{value}</div>
            <div className="text-xs font-medium text-zinc-500 mt-1">{label}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>
            <div className="text-[10px] font-mono text-zinc-700 mt-2">{note}</div>
          </div>
        ))}
      </div>

      {/* Pipeline steps */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-5">Pipeline Steps</div>
        <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
          {pipelineSteps.map((s, i) => (
            <div key={s.step} className="flex items-center flex-shrink-0">
              <div
                className="rounded-lg px-3 py-2.5 text-center min-w-[88px]"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: s.color, opacity: 0.7 }}>
                  Step {s.step}
                </div>
                <div className="text-[12px] font-semibold text-zinc-200 whitespace-nowrap">{s.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: s.color, opacity: 0.6 }}>{s.sub}</div>
              </div>
              {i < pipelineSteps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0 mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Runs */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-sm font-semibold text-zinc-200">Workflow Runs</span>
            {runs.length > 0 && (
              <span className="text-[10px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded-full">
                {runs.length} runs
              </span>
            )}
          </div>
          {!fetched ? (
            <button
              onClick={fetchRuns}
              className="text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              Load history
            </button>
          ) : (
            <button
              onClick={fetchRuns}
              disabled={loading}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin-slow')} />
            </button>
          )}
        </div>

        {!fetched ? (
          <div className="py-14 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/40 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-5 h-5 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500">Click "Load history" to fetch runs from GitHub</p>
            <p className="text-xs text-zinc-700 mt-1">Requires GH_TOKEN with actions:read scope</p>
          </div>
        ) : loading ? (
          <div className="py-14 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin-slow" />
            <p className="text-sm text-zinc-600">Fetching runs…</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-zinc-500">No workflow runs found.</p>
            <p className="text-xs text-zinc-700 mt-1">Check GH_TOKEN and GH_REPO configuration.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Run', 'Status', 'Trigger', 'Duration', 'Started', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run, idx) => (
                <tr
                  key={run.id}
                  className="hover:bg-white/[0.02] transition-colors"
                  style={{ borderBottom: idx < runs.length - 1 ? '1px solid var(--border)' : undefined }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <RunStatusIcon run={run} />
                      <div>
                        <div className="text-[13px] font-medium text-zinc-200">Run #{run.run_number}</div>
                        <div className="text-[10px] text-zinc-600">{run.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><RunStatusBadge run={run} /></td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 rounded-md">
                      {run.event === 'schedule' ? <Calendar className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                      {run.event}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[12px] text-zinc-500 font-mono">
                      {run.status === 'completed' ? formatDuration(run.run_started_at, run.updated_at) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[11px] text-zinc-600">
                      {new Date(run.created_at).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <a
                      href={run.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-700 hover:text-violet-400 transition-colors rounded inline-flex"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
