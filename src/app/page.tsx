import Link from 'next/link';
import {
  Zap, Brain, Mic2, Film, Scissors, Cloud, Youtube, ArrowRight,
  CheckCircle2, TrendingUp, Clock, DollarSign, ChevronRight,
  BarChart2, Sparkles, Shield, Globe,
} from 'lucide-react';

// ── Pipeline steps ────────────────────────────────────────────────────────────

const steps = [
  { n: 1, label: 'Topic',      sub: 'Queue',        color: '#a78bfa', icon: Brain },
  { n: 2, label: 'Script',     sub: 'Claude AI',    color: '#818cf8', icon: Brain },
  { n: 3, label: 'Voice',      sub: 'ElevenLabs',   color: '#60a5fa', icon: Mic2 },
  { n: 4, label: 'Clips',      sub: 'Kling Pro',    color: '#34d399', icon: Film },
  { n: 5, label: 'Assemble',   sub: 'FFmpeg',       color: '#fbbf24', icon: Scissors },
  { n: 6, label: 'Archive',    sub: 'R2 Storage',   color: '#f97316', icon: Cloud },
  { n: 7, label: 'Publish',    sub: 'YouTube API',  color: '#f87171', icon: Youtube },
];

// ── Features ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Brain,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.15)',
    title: 'AI Script Generation',
    desc: 'Claude crafts hook-first viral scripts optimised for Shorts retention — tone, niche and length all configurable from your dashboard.',
  },
  {
    icon: Film,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.15)',
    title: 'Cinematic Video Clips',
    desc: 'Kling 2.6 Pro generates photorealistic 9:16 clips via fal.ai. Up to 4 clips rendered in parallel to keep total pipeline time under 10 minutes.',
  },
  {
    icon: Mic2,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.15)',
    title: 'Premium Voiceover',
    desc: 'ElevenLabs produces studio-quality narration with word-level timestamps, enabling perfectly synced burned-in captions on every Short.',
  },
  {
    icon: TrendingUp,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.15)',
    title: 'Engagement Analytics',
    desc: 'Sync YouTube stats after publishing — views, likes, comments, engagement rate, and velocity. Spot the best day and hour to publish automatically.',
  },
  {
    icon: BarChart2,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.15)',
    title: 'Cost Tracking',
    desc: 'Every run logs a full cost breakdown — Claude, ElevenLabs, and Kling charges. Know your exact per-video cost, every time.',
  },
  {
    icon: Shield,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.15)',
    title: 'Secrets Vault',
    desc: 'All API keys live in the encrypted dashboard database — GitHub Actions only needs two env vars. Rotate credentials without touching CI.',
  },
];

// ── Tech stack ────────────────────────────────────────────────────────────────

const stackGroups = [
  {
    label: 'AI & Generation',
    color: '#a78bfa',
    items: [
      { label: 'Claude Sonnet 4.6',  href: 'https://anthropic.com',      color: '#a78bfa' },
      { label: 'ElevenLabs',         href: 'https://elevenlabs.io',       color: '#60a5fa' },
      { label: 'Kling 2.6 Pro',      href: 'https://klingai.com',         color: '#34d399' },
      { label: 'fal.ai',             href: 'https://fal.ai',              color: '#fbbf24' },
    ],
  },
  {
    label: 'Media & Publishing',
    color: '#f87171',
    items: [
      { label: 'FFmpeg',             href: 'https://ffmpeg.org',                            color: '#f97316' },
      { label: 'YouTube Data API v3',href: 'https://developers.google.com/youtube/v3',      color: '#f87171' },
      { label: 'Telegram Bot API',   href: 'https://core.telegram.org/bots/api',            color: '#38bdf8' },
      { label: 'Resend',             href: 'https://resend.com',                            color: '#fb7185' },
    ],
  },
  {
    label: 'Infrastructure',
    color: '#fb923c',
    items: [
      { label: 'Cloudflare R2',      href: 'https://developers.cloudflare.com/r2',          color: '#fb923c' },
      { label: 'NeonDB',             href: 'https://neon.tech',                             color: '#4ade80' },
      { label: 'GitHub Actions',     href: 'https://github.com/features/actions',           color: '#818cf8' },
      { label: 'AWS S3 SDK v3',      href: 'https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/', color: '#f59e0b' },
    ],
  },
  {
    label: 'Frontend & DX',
    color: '#e4e4e7',
    items: [
      { label: 'Next.js 16',         href: 'https://nextjs.org',          color: '#e4e4e7' },
      { label: 'React 19',           href: 'https://react.dev',           color: '#38bdf8' },
      { label: 'TypeScript 5',       href: 'https://typescriptlang.org',  color: '#60a5fa' },
      { label: 'Tailwind CSS',       href: 'https://tailwindcss.com',     color: '#34d399' },
    ],
  },
  {
    label: 'Data & Validation',
    color: '#4ade80',
    items: [
      { label: 'Drizzle ORM',        href: 'https://orm.drizzle.team',    color: '#a3e635' },
      { label: 'Zod',                href: 'https://zod.dev',             color: '#818cf8' },
      { label: 'PostgreSQL',         href: 'https://postgresql.org',      color: '#60a5fa' },
      { label: 'date-fns',           href: 'https://date-fns.org',        color: '#94a3b8' },
    ],
  },
];

const totalTools = stackGroups.reduce((s, g) => s + g.items.length, 0);

// ── Stats ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: '~8 min', label: 'Pipeline runtime', sub: 'idea to published Short' },
  { value: '25×',    label: 'Faster than manual', sub: 'vs ~3.5 hrs of human editing' },
  { value: '~$4',    label: 'Cost per video', sub: 'AI + voice + clips + hosting' },
  { value: '250×',   label: 'Runs / month free', sub: 'GitHub Actions free tier' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-10 h-14"
        style={{ background: 'rgba(8,8,10,0.75)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center glow-accent flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-zinc-100 tracking-tight">Short Publisher</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-[13px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
            Sign in
          </Link>
          <Link href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-white gradient-accent glow-accent hover:opacity-90 transition-opacity">
            Dashboard <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 sm:px-10 text-center overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(139,92,246,0.18) 0%, transparent 65%)' }} />
        <div className="absolute top-40 left-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-32 right-1/4 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-[0.3] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium text-violet-300 border border-violet-500/25 mb-8"
            style={{ background: 'rgba(139,92,246,0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-dot" />
            Fully autonomous · Zero manual steps
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-bold leading-[1.08] tracking-tight text-balance mb-6">
            Publish YouTube Shorts
            <br />
            <span className="gradient-text">on autopilot</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            An end-to-end AI pipeline that writes the script, generates cinematic video, adds a voiceover,
            burns captions, and publishes to YouTube — every day, automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-semibold text-white gradient-accent glow-accent hover:opacity-90 transition-opacity w-full sm:w-auto justify-center">
              <Zap className="w-4 h-4" />
              Open Dashboard
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all w-full sm:w-auto justify-center">
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pipeline visual ── */}
      <section className="px-6 sm:px-10 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-2">How it works</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">7-step automated pipeline</h2>
          </div>

          {/* Steps */}
          <div className="relative rounded-2xl p-6 sm:p-8 overflow-x-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-stretch gap-0 min-w-[600px]">
              {steps.map((s, i) => (
                <div key={s.n} className="flex items-center flex-1">
                  <div className="flex-1 flex flex-col items-center gap-2 px-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}14`, border: `1px solid ${s.color}30` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div className="text-center">
                      <div className="text-[12px] font-semibold text-zinc-200 whitespace-nowrap">{s.label}</div>
                      <div className="text-[10px] whitespace-nowrap mt-0.5" style={{ color: s.color, opacity: 0.7 }}>{s.sub}</div>
                    </div>
                    <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Step {s.n}</div>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-zinc-800 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="mt-6 pt-5 flex flex-wrap items-center justify-between gap-3"
              style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Clock className="w-3.5 h-3.5 text-zinc-700" />
                Runs daily at 09:00 UTC via GitHub Actions
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <DollarSign className="w-3.5 h-3.5 text-zinc-700" />
                ~$4 per published Short (all services included)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 sm:px-10 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(({ value, label, sub }) => (
              <div key={label} className="rounded-2xl p-5 text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-3xl font-bold gradient-text mb-1">{value}</div>
                <div className="text-sm font-semibold text-zinc-300">{label}</div>
                <div className="text-[11px] text-zinc-600 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 sm:px-10 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Features</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">Everything you need</h2>
            <p className="text-zinc-500 mt-3 text-sm max-w-xl mx-auto">
              From topic to published Short — every component of the pipeline is configurable from a single dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div key={title} className="rounded-2xl p-5 flex flex-col gap-3 group hover:border-opacity-50 transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100 mb-1">{title}</div>
                  <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className="px-6 sm:px-10 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Powered by</div>
            <h2 className="text-xl font-bold text-zinc-300">Best-in-class AI stack</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {stack.map(({ label, color }) => (
              <span key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border"
                style={{
                  background: `${color}0d`,
                  borderColor: `${color}28`,
                  color,
                }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview callout ── */}
      <section className="px-6 sm:px-10 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl p-8 sm:p-12 overflow-hidden text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium text-violet-300 border border-violet-500/25 mb-6"
                style={{ background: 'rgba(139,92,246,0.08)' }}>
                <Sparkles className="w-3 h-3" />
                Live dashboard included
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-4 text-balance">
                Monitor every video, every dollar
              </h2>
              <p className="text-zinc-500 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                A full management dashboard lets you track your content queue, review pipeline runs,
                analyse engagement patterns, manage secrets, and inspect per-video costs — all in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                {[
                  { icon: Globe, label: 'Topics queue' },
                  { icon: Film, label: 'Video history' },
                  { icon: BarChart2, label: 'Engagement analytics' },
                  { icon: DollarSign, label: 'Cost breakdown' },
                  { icon: Shield, label: 'Secrets vault' },
                  { icon: CheckCircle2, label: 'Pipeline runs' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    {label}
                  </span>
                ))}
              </div>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-semibold text-white gradient-accent glow-accent hover:opacity-90 transition-opacity">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 sm:px-10 py-8" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-[12px] font-semibold text-zinc-400">Short Publisher</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors">Dashboard</Link>
            <Link href="/login"     className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors">Sign in</Link>
          </div>
          <span className="text-[11px] text-zinc-700">© 2026 Short Publisher</span>
        </div>
      </footer>

    </div>
  );
}
