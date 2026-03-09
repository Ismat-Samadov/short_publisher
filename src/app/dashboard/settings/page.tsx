'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  RefreshCw,
  Calendar,
  Mic,
  Image,
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
        description: 'Enable or disable the daily scheduled pipeline run',
      },
      {
        key: 'schedule_cron',
        label: 'Cron expression',
        type: 'text',
        placeholder: '0 9 * * *',
        description: 'Standard cron format (UTC). Default: daily at 9:00 AM',
      },
      {
        key: 'videos_per_day',
        label: 'Videos per day',
        type: 'number',
        placeholder: '1',
        description: 'How many videos to publish per pipeline run',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    description: 'Default content settings for generated videos',
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
        placeholder: '55',
        description: 'Target video length (30–60 seconds recommended for Shorts)',
      },
      {
        key: 'video_style',
        label: 'Video style',
        type: 'select',
        options: [
          { value: 'stock-images', label: 'Stock images + voiceover' },
          { value: 'slideshow', label: 'Slideshow (text + images)' },
        ],
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
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI Models',
    description: 'Configure which AI models and voices to use',
    icon: Brain,
    color: 'text-indigo-400',
    fields: [
      {
        key: 'script_model',
        label: 'Script model',
        type: 'select',
        options: [
          { value: 'gpt-4o-mini', label: 'GPT-4o mini (recommended, cheap)' },
          { value: 'gpt-4o', label: 'GPT-4o (better quality, higher cost)' },
          { value: 'claude-haiku-4-5', label: 'Claude Haiku (cheapest)' },
        ],
      },
      {
        key: 'tts_provider',
        label: 'TTS provider',
        type: 'select',
        options: [
          { value: 'elevenlabs', label: 'ElevenLabs (primary)' },
          { value: 'openai', label: 'OpenAI TTS (fallback)' },
        ],
      },
      {
        key: 'image_source',
        label: 'Image source',
        type: 'select',
        options: [
          { value: 'pexels', label: 'Pexels (free stock)' },
          { value: 'dalle', label: 'DALL-E 3 (AI-generated, paid)' },
          { value: 'pexels+dalle', label: 'Pexels with DALL-E fallback' },
        ],
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
    description: 'Text-to-speech voice configuration',
    icon: Mic,
    color: 'text-emerald-400',
    fields: [
      {
        key: 'elevenlabs_voice_id',
        label: 'ElevenLabs voice ID',
        type: 'text',
        placeholder: 'EXAVITQu4vr4xnSDxMaL',
        description: 'Get voice IDs from your ElevenLabs dashboard',
      },
      {
        key: 'openai_tts_voice',
        label: 'OpenAI TTS voice',
        type: 'select',
        options: [
          { value: 'alloy', label: 'Alloy (neutral)' },
          { value: 'echo', label: 'Echo (male)' },
          { value: 'fable', label: 'Fable (warm)' },
          { value: 'onyx', label: 'Onyx (deep)' },
          { value: 'nova', label: 'Nova (female)' },
          { value: 'shimmer', label: 'Shimmer (expressive)' },
        ],
      },
      {
        key: 'speech_speed',
        label: 'Speech speed',
        type: 'select',
        options: [
          { value: '0.9', label: '0.9× (slower)' },
          { value: '1.0', label: '1.0× (normal)' },
          { value: '1.1', label: '1.1× (slightly faster)' },
          { value: '1.2', label: '1.2× (faster)' },
        ],
      },
    ],
  },
  {
    id: 'visuals',
    title: 'Visuals',
    description: 'Image and video assembly settings',
    icon: Image,
    color: 'text-cyan-400',
    fields: [
      {
        key: 'images_per_video',
        label: 'Images per video',
        type: 'number',
        placeholder: '6',
        description: 'Number of stock images to use in each video',
      },
      {
        key: 'ken_burns_enabled',
        label: 'Ken Burns effect',
        type: 'toggle',
        description: 'Slow zoom/pan effect on images (more dynamic look)',
      },
      {
        key: 'captions_enabled',
        label: 'Auto-captions',
        type: 'toggle',
        description: 'Add auto-generated captions using Whisper',
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
      {
        key: 'approval_required',
        label: 'Require approval before publish',
        type: 'toggle',
        description: 'Send a Telegram approval message before uploading to YouTube',
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
              className="w-full max-w-xs text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
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
            className="w-full max-w-xs text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Configure your pipeline, AI models, and publishing preferences
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg border border-transparent hover:border-zinc-700 transition-all"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin-slow')} />
        </button>
      </div>

      {/* Note about secrets */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-500">
          <span className="text-amber-300 font-medium">API keys and secrets</span> (OpenAI, ElevenLabs, YouTube, Telegram tokens) must be set as{' '}
          <strong className="text-zinc-400">GitHub Actions Secrets</strong> and{' '}
          <strong className="text-zinc-400">.env.local</strong> variables — not stored here.
          These settings control pipeline behavior, not credentials.
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
              <div className="grid grid-cols-2 gap-2">
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
