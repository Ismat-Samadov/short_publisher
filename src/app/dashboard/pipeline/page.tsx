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
  Info,
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
    return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin-slow" />;
  }
  if (run.conclusion === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (run.conclusion === 'failure') return <XCircle className="w-4 h-4 text-red-400" />;
  if (run.conclusion === 'cancelled') return <AlertCircle className="w-4 h-4 text-amber-400" />;
  return <Clock className="w-4 h-4 text-zinc-500" />;
}

function RunStatusBadge({ run }: { run: WorkflowRun }) {
  if (run.status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
        Running
      </span>
    );
  }
  if (run.status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot" />
        Queued
      </span>
    );
  }
  if (run.conclusion === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Success
      </span>
    );
  }
  if (run.conclusion === 'failure') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-red-950/60 text-red-300 border border-red-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
      {run.conclusion ?? run.status}
    </span>
  );
}

function formatDuration(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const diff = Math.round((e - s) / 1000);
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m ${diff % 60}s`;
}

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
      if (res.ok) {
        setTriggerResult({ ok: true, message: 'Pipeline triggered! Check GitHub Actions for progress.' });
        setTimeout(() => fetchRuns(), 3000);
      } else {
        setTriggerResult({ ok: false, message: data.error ?? 'Failed to trigger pipeline.' });
      }
    } catch {
      setTriggerResult({ ok: false, message: 'Network error. Check your GH_TOKEN setting.' });
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Pipeline</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage and monitor your GitHub Actions video generation pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRuns()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin-slow')} />
            Refresh
          </button>
          <button
            onClick={() => triggerRun(true)}
            disabled={triggering}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Dry Run
          </button>
          <button
            onClick={() => triggerRun(false)}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {triggering ? (
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            Trigger Now
          </button>
        </div>
      </div>

      {/* Trigger result */}
      {triggerResult && (
        <div
          className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-lg border text-sm',
            triggerResult.ok
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-red-950/40 border-red-800/60 text-red-300'
          )}
        >
          {triggerResult.ok ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          {triggerResult.message}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-zinc-200">Schedule</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100 mb-1">Daily</div>
          <div className="text-xs text-zinc-500">Every day at 09:00 UTC</div>
          <div className="text-xs text-zinc-700 mt-1 font-mono">cron: 0 9 * * *</div>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-zinc-200">Avg Duration</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100 mb-1">~8 min</div>
          <div className="text-xs text-zinc-500">script → audio → visuals → assemble → upload</div>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-zinc-200">GitHub Actions</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100 mb-1">2,000</div>
          <div className="text-xs text-zinc-500">free minutes/month (≈250 runs)</div>
        </div>
      </div>

      {/* Pipeline steps visualization */}
      <div
        className="rounded-xl border p-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-sm font-semibold text-zinc-200 mb-5">Pipeline Steps</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {[
            { step: '1', label: 'Fetch Topic', sub: 'from DB', color: 'bg-violet-500/20 border-violet-500/30 text-violet-300' },
            { step: '2', label: 'Generate Script', sub: 'GPT-4o-mini', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
            { step: '3', label: 'Generate Audio', sub: 'ElevenLabs / TTS', color: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' },
            { step: '4', label: 'Generate Visuals', sub: 'Pexels / DALL-E', color: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' },
            { step: '5', label: 'Assemble Video', sub: 'FFmpeg', color: 'bg-teal-500/20 border-teal-500/30 text-teal-300' },
            { step: '6', label: 'Upload to R2', sub: 'Cloudflare', color: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
            { step: '7', label: 'Upload YouTube', sub: 'Data API v3', color: 'bg-red-500/20 border-red-500/30 text-red-300' },
            { step: '8', label: 'Notify', sub: 'Telegram', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
          ].map((s, i, arr) => (
            <div key={s.step} className="flex items-center flex-shrink-0">
              <div className={cn('rounded-lg border px-3 py-2 text-center min-w-[90px]', s.color)}>
                <div className="text-[10px] font-bold opacity-60 mb-0.5">Step {s.step}</div>
                <div className="text-xs font-semibold whitespace-nowrap">{s.label}</div>
                <div className="text-[10px] opacity-60 mt-0.5">{s.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div className="w-5 text-center text-zinc-700 text-xs flex-shrink-0">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Workflow runs */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold text-zinc-200">Recent Workflow Runs</h2>
          {!fetched && (
            <button
              onClick={fetchRuns}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Load runs
            </button>
          )}
        </div>

        {!fetched ? (
          <div className="px-6 py-12 text-center">
            <Info className="w-6 h-6 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Click "Load runs" to fetch workflow history from GitHub.</p>
            <p className="text-xs text-zinc-700 mt-1">Requires GH_TOKEN and repo settings.</p>
          </div>
        ) : loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin-slow" />
            <p className="text-sm text-zinc-600">Fetching runs…</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <PlayCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No workflow runs found.</p>
            <p className="text-xs text-zinc-700 mt-1">
              Make sure GH_TOKEN and repo settings are configured correctly.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Run', 'Status', 'Trigger', 'Duration', 'Started', ''].map((h) => (
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
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="hover:bg-zinc-800/30 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <RunStatusIcon run={run} />
                      <div>
                        <div className="text-sm font-medium text-zinc-200">Run #{run.run_number}</div>
                        <div className="text-xs text-zinc-600">{run.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <RunStatusBadge run={run} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800/60 border border-zinc-700/60 px-2 py-0.5 rounded">
                      {run.event === 'schedule' ? <Calendar className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                      {run.event}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-zinc-500">
                      {run.status === 'completed'
                        ? formatDuration(run.run_started_at, run.updated_at)
                        : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-zinc-500">
                      {new Date(run.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={run.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-zinc-300 transition-colors"
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
