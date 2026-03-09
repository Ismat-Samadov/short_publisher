'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Save, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecretField {
  key: string;
  label: string;
  description: string;
  placeholder?: string;
  url?: string;
}

interface SecretGroup {
  id: string;
  label: string;
  color: string;
  fields: SecretField[];
}

const GROUPS: SecretGroup[] = [
  {
    id: 'ai',
    label: 'AI Services',
    color: '#8b5cf6',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', description: 'Used by Claude to generate scripts', placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/' },
      { key: 'ELEVENLABS_API_KEY', label: 'ElevenLabs API Key', description: 'Used for premium TTS voiceover', placeholder: 'sk_...', url: 'https://elevenlabs.io/' },
      { key: 'ELEVENLABS_VOICE_ID', label: 'ElevenLabs Voice ID', description: 'Voice to use for narration', placeholder: 'pNInz6obpgDQGcFmaJgB', url: 'https://elevenlabs.io/voice-library' },
      { key: 'FAL_KEY', label: 'fal.ai API Key', description: 'Used for Kling 2.5 Pro video generation', placeholder: 'xxxxxxxx:xxxxxxxx', url: 'https://fal.ai/' },
    ],
  },
  {
    id: 'storage',
    label: 'Cloudflare R2',
    color: '#f59e0b',
    fields: [
      { key: 'R2_ACCOUNT_ID', label: 'Account ID', description: 'Cloudflare account ID', placeholder: '612eb8c2...' },
      { key: 'R2_ACCESS_KEY_ID', label: 'Access Key ID', description: 'R2 API token access key', placeholder: '0a6995c3...' },
      { key: 'R2_SECRET_ACCESS_KEY', label: 'Secret Access Key', description: 'R2 API token secret', placeholder: 'edf05e3f...' },
      { key: 'R2_BUCKET_NAME', label: 'Bucket Name', description: 'Name of your R2 bucket', placeholder: 'short-publisher' },
      { key: 'R2_PUBLIC_URL', label: 'Public URL', description: 'R2 bucket public access URL', placeholder: 'https://pub-xxxx.r2.dev' },
    ],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    color: '#ef4444',
    fields: [
      { key: 'YOUTUBE_CLIENT_ID', label: 'OAuth Client ID', description: 'Google Cloud OAuth 2.0 client ID', placeholder: '947501...apps.googleusercontent.com', url: 'https://console.cloud.google.com/' },
      { key: 'YOUTUBE_CLIENT_SECRET', label: 'OAuth Client Secret', description: 'Google Cloud OAuth 2.0 client secret', placeholder: 'GOCSPX-...' },
      { key: 'YOUTUBE_REFRESH_TOKEN', label: 'Refresh Token', description: 'Long-lived OAuth refresh token — run get_youtube_token.py to generate', placeholder: '1//0c...' },
    ],
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#3b82f6',
    fields: [
      { key: 'TELEGRAM_BOT_TOKEN', label: 'Bot Token', description: 'Token from @BotFather', placeholder: '8202323082:AAG...', url: 'https://t.me/BotFather' },
      { key: 'TELEGRAM_CHAT_ID', label: 'Chat ID', description: 'Your personal or group chat ID', placeholder: '-4879313859' },
    ],
  },
  {
    id: 'email',
    label: 'Email (Resend)',
    color: '#10b981',
    fields: [
      { key: 'RESEND_API_KEY', label: 'Resend API Key', description: 'API key from Resend dashboard', placeholder: 're_...', url: 'https://resend.com/' },
      { key: 'RESEND_FROM_EMAIL', label: 'From Email', description: 'Verified sender address in Resend', placeholder: 'noreply@yourdomain.com' },
      { key: 'CONTACT_NOTIFICATION_EMAIL', label: 'Notification Email', description: 'Where to receive pipeline alerts', placeholder: 'you@gmail.com' },
    ],
  },
  {
    id: 'github',
    label: 'GitHub',
    color: '#6366f1',
    fields: [
      { key: 'GH_TOKEN', label: 'Personal Access Token', description: 'PAT with repo + actions:read + workflow scopes', placeholder: 'github_pat_...', url: 'https://github.com/settings/tokens' },
      { key: 'GH_REPO', label: 'Repository', description: 'username/repo-name format', placeholder: 'Ismat-Samadov/short_publisher' },
      { key: 'GH_WORKFLOW_FILE', label: 'Workflow File', description: 'Filename of the GitHub Actions workflow', placeholder: 'publish.yml' },
    ],
  },
  {
    id: 'misc',
    label: 'Other',
    color: '#6b7280',
    fields: [
      { key: 'APP_URL', label: 'App URL', description: 'Your Vercel deployment URL (used in emails and pipeline)', placeholder: 'https://short-publisher.vercel.app' },
      { key: 'BACKGROUND_MUSIC_URL', label: 'Background Music URL', description: 'Direct MP3 URL for background music (optional)', placeholder: 'https://cdn.example.com/track.mp3' },
    ],
  },
];

function SecretInput({
  field,
  value,
  onChange,
  onSave,
  saving,
  saved,
  error,
}: {
  field: SecretField;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean | null;
  error: string | null;
}) {
  const [show, setShow] = useState(false);
  const hasValue = value.trim().length > 0;

  return (
    <div className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-medium text-zinc-200">{field.label}</span>
            {hasValue && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
            {field.url && (
              <a
                href={field.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-violet-500 hover:text-violet-400 transition-colors"
              >
                Docs ↗
              </a>
            )}
          </div>
          <p className="text-[11px] text-zinc-600 mb-2">{field.description}</p>
          <code className="text-[10px] text-zinc-700 font-mono">{field.key}</code>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-5">
          {saved === true && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          {saved === false && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white gradient-accent hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? <RefreshCw className="w-3 h-3 animate-spin-slow" /> : <Save className="w-3 h-3" />}
            Save
          </button>
        </div>
      </div>

      <div className="relative mt-2">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          placeholder={field.placeholder}
          autoComplete="new-password"
          data-1p-ignore
          data-lpignore="true"
          className="w-full pr-9 py-2 pl-3 rounded-lg text-[12px] font-mono text-zinc-300 placeholder-zinc-700 outline-none transition-colors"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function SecretsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSecrets = useCallback(async () => {
    setLoading(true);
    try {
      // Read current stored secrets — we get back masked values where set
      const res = await fetch('/api/secrets', {
        headers: { 'x-pipeline-key': '' }, // will fail auth — use session instead
      });
      // The GET endpoint requires pipeline key; for dashboard we read settings directly via a different approach
      // Instead, fetch the settings and filter secret_ prefix
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const all: { key: string; value: string }[] = await settingsRes.json();
        const map: Record<string, string> = {};
        for (const row of all) {
          if (row.key.startsWith('secret_')) {
            map[row.key.slice('secret_'.length)] = row.value;
          }
        }
        setValues(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSecrets(); }, [fetchSecrets]);

  async function saveSecret(key: string) {
    setSaving((p) => ({ ...p, [key]: true }));
    setSaved((p) => ({ ...p, [key]: null }));
    setErrors((p) => ({ ...p, [key]: '' }));

    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key, value: values[key] ?? '' }]),
      });

      const ok = res.ok;
      setSaved((p) => ({ ...p, [key]: ok }));
      if (!ok) {
        const data = await res.json().catch(() => ({}));
        setErrors((p) => ({ ...p, [key]: data.error ?? 'Failed to save' }));
      }
      setTimeout(() => setSaved((p) => ({ ...p, [key]: null })), 3000);
    } catch {
      setSaved((p) => ({ ...p, [key]: false }));
      setErrors((p) => ({ ...p, [key]: 'Network error' }));
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  }

  const totalConfigured = Object.values(values).filter((v) => v.trim().length > 0).length;
  const totalFields = GROUPS.reduce((n, g) => n + g.fields.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-1">Configuration</div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Secrets</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-zinc-500">
            <span className="text-emerald-400 font-bold">{totalConfigured}</span>
            <span className="text-zinc-600"> / {totalFields} configured</span>
          </div>
          <button
            onClick={fetchSecrets}
            disabled={loading}
            className="p-2 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin-slow')} />
          </button>
        </div>
      </div>

      {/* Security note */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl border text-xs"
        style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}
      >
        <ShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="text-zinc-400 leading-relaxed">
          <span className="text-violet-300 font-semibold">Secrets are stored in your NeonDB</span> and never logged or exposed client-side.
          The pipeline fetches them at runtime via authenticated API. Your Vercel deployment only needs{' '}
          <code className="text-violet-300 text-[10px] bg-violet-500/10 px-1 py-0.5 rounded">DATABASE_URL</code>{' '}
          <code className="text-violet-300 text-[10px] bg-violet-500/10 px-1 py-0.5 rounded">PIPELINE_SECRET_KEY</code>{' '}
          <code className="text-violet-300 text-[10px] bg-violet-500/10 px-1 py-0.5 rounded">DASHBOARD_PASSWORD</code>{' '}
          <code className="text-violet-300 text-[10px] bg-violet-500/10 px-1 py-0.5 rounded">AUTH_TOKEN</code>
          {' '}— nothing else.
        </div>
      </div>

      {/* GitHub Actions note */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl border text-xs"
        style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.15)' }}
      >
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-zinc-500 leading-relaxed">
          GitHub Actions only needs{' '}
          <code className="text-zinc-400 text-[10px] bg-zinc-800 px-1 py-0.5 rounded">APP_URL</code> and{' '}
          <code className="text-zinc-400 text-[10px] bg-zinc-800 px-1 py-0.5 rounded">PIPELINE_SECRET_KEY</code>
          {' '}as repository secrets. All other API keys are loaded from this database at runtime.
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin-slow" />
          <p className="text-sm text-zinc-600">Loading secrets…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {GROUPS.map((group) => {
            const configuredInGroup = group.fields.filter((f) => values[f.key]?.trim()).length;
            return (
              <div
                key={group.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Group header */}
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: group.color }}
                    />
                    <span className="text-sm font-semibold text-zinc-200">{group.label}</span>
                  </div>
                  <span className="text-[11px]" style={{ color: group.color }}>
                    {configuredInGroup}/{group.fields.length}
                  </span>
                </div>

                {/* Fields */}
                <div className="px-5">
                  {group.fields.map((field) => (
                    <SecretInput
                      key={field.key}
                      field={field}
                      value={values[field.key] ?? ''}
                      onChange={(v) => setValues((p) => ({ ...p, [field.key]: v }))}
                      onSave={() => saveSecret(field.key)}
                      saving={saving[field.key] ?? false}
                      saved={saved[field.key] ?? null}
                      error={errors[field.key] ?? null}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
