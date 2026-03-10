'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  RefreshCw,
  Calendar,
  Mic,
  Youtube,
  MessageSquare,
  Brain,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingField {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'select' | 'toggle';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fields: SettingField[];
}

const sections: SettingSection[] = [
  {
    id: 'schedule',
    title: 'Schedule',
    description: 'Configure when the pipeline runs automatically',
    icon: Calendar,
    color: 'text-violet-400',
    fields: [
      {
        key: 'schedule_enabled',
        label: 'Auto-publish enabled',
        type: 'toggle',
        description: 'When off, the pipeline exits immediately even when GitHub Actions fires it',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    description: 'Script and video content settings passed to the pipeline',
    icon: Brain,
    color: 'text-blue-400',
    fields: [
      {
        key: 'default_niche',
        label: 'Default niche',
        type: 'text',
        placeholder: 'Technology',
        description: 'Used when a topic has no niche set',
      },
      {
        key: 'video_duration_target',
        label: 'Target duration (seconds)',
        type: 'number',
        placeholder: '30',
        description: 'Target video length. Kling v2.6 pro bills 20s/clip so 3 clips = ~$4.33 total.',
      },
      {
        key: 'max_clips',
        label: 'Max Kling clips',
        type: 'select',
        options: [
          { value: '1', label: '1 clip — 20s billed (~$1.53 total)' },
          { value: '2', label: '2 clips — 40s billed (~$2.93 total)' },
          { value: '3', label: '3 clips — 60s billed (~$4.33 total) ← recommended' },
          { value: '4', label: '4 clips — 80s billed (~$5.73 total)' },
          { value: '5', label: '5 clips — 100s billed (~$7.13 total)' },
          { value: '6', label: '6 clips — 120s billed (~$8.53 total)' },
          { value: '9', label: '9 clips — 180s billed (~$12.73 total)' },
        ],
        description: 'Kling v2.6 pro bills 20s minimum per clip regardless of duration. Total includes all services.',
      },
      {
        key: 'script_tone',
        label: 'Script tone',
        type: 'select',
        options: [
          { value: 'educational', label: 'Educational' },
          { value: 'entertaining', label: 'Entertaining' },
          { value: 'motivational', label: 'Motivational' },
          { value: 'news', label: 'News / Informational' },
        ],
        description: 'Writing style and tone applied by Claude when generating scripts',
      },
      {
        key: 'captions_enabled',
        label: 'Burned-in captions',
        type: 'toggle',
        description: 'Overlay word-by-word captions on the final video (uses ElevenLabs timestamps)',
      },
    ],
  },
  {
    id: 'youtube',
    title: 'YouTube',
    description: 'YouTube channel and upload settings',
    icon: Youtube,
    color: 'text-red-400',
    fields: [
      {
        key: 'youtube_category_id',
        label: 'Category ID',
        type: 'select',
        options: [
          { value: '28', label: '28 — Science & Technology' },
          { value: '22', label: '22 — People & Blogs' },
          { value: '24', label: '24 — Entertainment' },
          { value: '27', label: '27 — Education' },
        ],
      },
      {
        key: 'youtube_visibility',
        label: 'Default visibility',
        type: 'select',
        options: [
          { value: 'public', label: 'Public' },
          { value: 'unlisted', label: 'Unlisted (review first)' },
          { value: 'private', label: 'Private' },
        ],
      },
      {
        key: 'youtube_made_for_kids',
        label: 'Made for kids',
        type: 'toggle',
        description: 'Mark videos as made for kids (COPPA compliance)',
      },
    ],
  },
  {
    id: 'tts',
    title: 'Voice',
    description: 'ElevenLabs voice configuration',
    icon: Mic,
    color: 'text-emerald-400',
    fields: [
      {
        key: 'elevenlabs_voice_id',
        label: 'ElevenLabs voice ID',
        type: 'text',
        placeholder: 'EXAVITQu4vr4xnSDxMaL',
        description: 'Overrides the ELEVENLABS_VOICE_ID secret. Find voice IDs in your ElevenLabs dashboard.',
      },
    ],
  },
  {
    id: 'telegram',
    title: 'Telegram',
    description: 'Telegram bot notification preferences',
    icon: MessageSquare,
    color: 'text-blue-400',
    fields: [
      {
        key: 'notify_on_success',
        label: 'Notify on success',
        type: 'toggle',
        description: 'Send Telegram message when a video is published',
      },
      {
        key: 'notify_on_failure',
        label: 'Notify on failure',
        type: 'toggle',
        description: 'Send Telegram alert when the pipeline fails',
      },
    ],
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Resend email notification preferences',
    icon: Mail,
    color: 'text-violet-400',
    fields: [
      {
        key: 'email_on_publish',
        label: 'Email on publish',
        type: 'toggle',
        description: 'Send an email when a video is successfully published to YouTube',
      },
      {
        key: 'email_on_failure',
        label: 'Email on failure',
        type: 'toggle',
        description: 'Send an email alert when the pipeline encounters an error',
      },
      {
        key: 'email_daily_digest',
        label: 'Daily digest',
        type: 'toggle',
        description: 'Receive a daily summary of pipeline activity each morning',
      },
    ],
  },
];

type TestType = 'email_publish' | 'email_error' | 'email_digest' | 'telegram';

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string[]>(['schedule', 'content']);
  const [testing, setTesting] = useState<TestType | null>(null);
  const [testResult, setTestResult] = useState<{ type: TestType; ok: boolean; message: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: { key: string; value: string }[] = await res.json();
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.key] = s.value; });
        setValues(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  function toggleSection(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBool(key: string) {
    const current = values[key] === 'true';
    handleChange(key, String(!current));
  }

  async function sendTestNotification(type: TestType) {
    setTesting(type);
    setTestResult(null);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setTestResult({
        type,
        ok: res.ok,
        message: res.ok ? 'Test sent — check your inbox / Telegram.' : (data.error ?? 'Failed to send.'),
      });
    } catch {
      setTestResult({ type, ok: false, message: 'Network error.' });
    } finally {
      setTesting(null);
      setTimeout(() => setTestResult(null), 6000);
    }
  }

  async function saveSection(section: SettingSection) {
    setSaving(section.id);
    try {
      const updates = section.fields
        .filter((f) => values[f.key] !== undefined)
        .map((f) => ({ key: f.key, value: values[f.key] }));

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });

      setSaveResult((prev) => ({ ...prev, [section.id]: res.ok }));
      setTimeout(() => setSaveResult((prev) => { const n = { ...prev }; delete n[section.id]; return n; }), 3000);
    } finally {
      setSaving(null);
    }
  }

  function renderField(field: SettingField) {
    const value = values[field.key] ?? '';

    if (field.type === 'toggle') {
      const isOn = value === 'true';
      return (
        <div key={field.key} className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-300">{field.label}</div>
            {field.description && (
              <div className="text-xs text-zinc-600 mt-0.5">{field.description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => toggleBool(field.key)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5',
              isOn ? 'bg-violet-500' : 'bg-zinc-700'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                isOn && 'translate-x-5'
              )}
            />
          </button>
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key} className="flex items-start gap-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-300 mb-1.5">{field.label}</div>
            {field.description && (
              <div className="text-xs text-zinc-600 mb-2">{field.description}</div>
            )}
            <select
              value={value}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full sm:max-w-xs text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--fg-2)',
              }}
            >
              <option value="">— Select —</option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value} style={{ background: '#09090b' }}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    return (
      <div key={field.key} className="flex items-start gap-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-zinc-300 mb-1.5">{field.label}</div>
          {field.description && (
            <div className="text-xs text-zinc-600 mb-2">{field.description}</div>
          )}
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full sm:max-w-xs text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--fg-2)',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Configure your pipeline, AI models, and publishing preferences
        </p>
      </div>

      {/* Note about secrets */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-500">
          <span className="text-blue-300 font-medium">API keys and tokens</span> (Anthropic, ElevenLabs, YouTube, Telegram, etc.) are managed in the{' '}
          <a href="/dashboard/secrets" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">Secrets</a> page.
          These settings control pipeline <strong className="text-zinc-400">behavior</strong>, not credentials.
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin-slow" />
          <p className="text-sm text-zinc-600">Loading settings…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Test Notifications */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <Send className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-200">Test Notifications</div>
                <div className="text-xs text-zinc-600 mt-0.5">Send a test message to verify email and Telegram are configured</div>
              </div>
            </div>
            <div className="px-6 py-5">
              {testResult && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs mb-4 border',
                    testResult.ok
                      ? 'text-emerald-300 border-emerald-800/50'
                      : 'text-red-300 border-red-800/50'
                  )}
                  style={{ background: testResult.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}
                >
                  {testResult.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                  {testResult.message}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {([
                  { type: 'email_publish' as TestType, label: 'Email: Published', icon: Mail, color: 'text-emerald-400' },
                  { type: 'email_error' as TestType, label: 'Email: Error', icon: Mail, color: 'text-red-400' },
                  { type: 'email_digest' as TestType, label: 'Email: Digest', icon: Mail, color: 'text-violet-400' },
                  { type: 'telegram' as TestType, label: 'Telegram', icon: Zap, color: 'text-blue-400' },
                ]).map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => sendTestNotification(type)}
                    disabled={testing !== null}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-zinc-800 hover:border-zinc-700 transition-all disabled:opacity-40"
                  >
                    {testing === type
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                      : <Icon className={cn('w-3.5 h-3.5', color)} />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sections.map((section) => {
            const isOpen = expanded.includes(section.id);
            const isSaving = saving === section.id;
            const savedResult = saveResult[section.id];

            return (
              <div
                key={section.id}
                className="rounded-xl border overflow-hidden transition-all"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <section.icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-zinc-200">{section.title}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{section.description}</div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                </button>

                {/* Section body */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="px-6 divide-y" style={{ borderColor: 'var(--border)' }}>
                      {section.fields.map((field) => renderField(field))}
                    </div>

                    {/* Save button */}
                    <div
                      className="flex items-center justify-between px-6 py-4"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      {savedResult !== undefined && (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 text-xs',
                            savedResult ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {savedResult ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          {savedResult ? 'Saved successfully' : 'Failed to save'}
                        </div>
                      )}
                      <div className="ml-auto">
                        <button
                          onClick={() => saveSection(section)}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin-slow" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save {section.title}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
