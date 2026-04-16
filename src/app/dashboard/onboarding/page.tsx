'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Rocket, ExternalLink, MinusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthCheck {
  id: string;
  label: string;
  status: 'ok' | 'error' | 'missing' | 'skip';
  message?: string;
  required: boolean;
}

interface HealthResponse {
  ready: boolean;
  checks: HealthCheck[];
}

const DOCS: Record<string, string> = {
  database:   'docs/variables/neondb.md',
  anthropic:  'docs/variables/anthropic.md',
  elevenlabs: 'docs/variables/elevenlabs.md',
  fal:        'docs/variables/fal.md',
  r2:         'docs/variables/cloudflare-r2.md',
  youtube:    '/dashboard/settings/youtube-auth',
  telegram:   'docs/variables/telegram.md',
  github:     'docs/variables/github.md',
  resend:     'docs/variables/resend.md',
};

function StatusIcon({ status }: { status: HealthCheck['status'] }) {
  if (status === 'ok')      return <CheckCircle2  className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  if (status === 'error')   return <XCircle       className="w-4 h-4 text-red-400 flex-shrink-0" />;
  if (status === 'missing') return <AlertCircle   className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
  return                           <MinusCircle   className="w-4 h-4 text-zinc-600 flex-shrink-0" />;
}

function statusColor(status: HealthCheck['status']) {
  if (status === 'ok')      return 'text-emerald-400';
  if (status === 'error')   return 'text-red-400';
  if (status === 'missing') return 'text-yellow-400';
  return 'text-zinc-600';
}

function statusLabel(status: HealthCheck['status']) {
  if (status === 'ok')      return 'Connected';
  if (status === 'error')   return 'Error';
  if (status === 'missing') return 'Not configured';
  return 'Skipped';
}

export default function OnboardingPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  async function runChecks() {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setData(await res.json());
        setLastRun(new Date());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { runChecks(); }, []);

  const required  = data?.checks.filter((c) => c.required)  ?? [];
  const optional  = data?.checks.filter((c) => !c.required) ?? [];
  const doneCount = required.filter((c) => c.status === 'ok').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-violet-400" />
            Setup Checklist
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Verify all services are connected before running the pipeline
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin-slow')} />
          {loading ? 'Checking…' : 'Re-check'}
        </button>
      </div>

      {/* Progress bar */}
      {data && (
        <div
          className="rounded-xl p-4 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-300">
              {data.ready ? 'All required services connected' : `${doneCount} / ${required.length} required services connected`}
            </span>
            {data.ready
              ? <span className="text-xs text-emerald-400 font-medium">Ready to run pipeline</span>
              : <span className="text-xs text-yellow-400 font-medium">Setup incomplete</span>
            }
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                data.ready ? 'bg-emerald-500' : 'bg-violet-500'
              )}
              style={{ width: `${(doneCount / required.length) * 100}%` }}
            />
          </div>
          {lastRun && (
            <div className="text-[10px] text-zinc-700 mt-2">
              Last checked: {lastRun.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Required services */}
      {required.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2 px-1">
            Required
          </h2>
          <div className="rounded-xl border overflow-hidden divide-y divide-zinc-800" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {required.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </div>
      )}

      {/* Optional services */}
      {optional.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2 px-1">
            Optional
          </h2>
          <div className="rounded-xl border overflow-hidden divide-y divide-zinc-800" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {optional.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-4 h-4 rounded-full bg-zinc-800" />
              <div className="h-3 bg-zinc-800 rounded w-40" />
              <div className="ml-auto h-3 bg-zinc-800 rounded w-20" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckRow({ check }: { check: HealthCheck }) {
  const doc = DOCS[check.id];
  const isInternalLink = doc?.startsWith('/');

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/20 transition-colors"
      style={{ borderColor: 'var(--border)' }}
    >
      <StatusIcon status={check.status} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-200">{check.label}</div>
        {check.message && (
          <div className="text-xs text-zinc-600 mt-0.5 truncate">{check.message}</div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={cn('text-xs font-medium', statusColor(check.status))}>
          {statusLabel(check.status)}
        </span>
        {doc && check.status !== 'ok' && (
          <a
            href={isInternalLink ? doc : `https://github.com/Ismat-Samadov/short_publisher/blob/main/${doc}`}
            target={isInternalLink ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {isInternalLink ? 'Fix' : 'Docs'}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
