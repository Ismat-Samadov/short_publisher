'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Lock, Eye, EyeOff, Video, Bot, BarChart3 } from 'lucide-react';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') || '/dashboard';

  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 60%)' }}
        />
      </div>

      {/* Dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />

      {/* Main content */}
      <div className="w-full max-w-sm relative z-10 animate-fade-in">

        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-5">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-60"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            />
            <div className="relative w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center glow-accent-lg">
              <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Short Publisher</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Autonomous YouTube Shorts pipeline</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            boxShadow: '0 0 0 1px rgba(139,92,246,0.04), 0 24px 48px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Dashboard password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-700 outline-none transition-all"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-2)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400"
              style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            onMouseEnter={(e) => { if (!loading && password) e.currentTarget.style.opacity = '0.92'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          {[
            { icon: Bot, label: 'AI-generated scripts' },
            { icon: Video, label: 'Auto publishing' },
            { icon: BarChart3, label: 'Analytics' },
          ].map(({ icon: Icon, label }) => (
            <div key={label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-zinc-600"
              style={{ border: '1px solid var(--border)' }}>
              <Icon className="w-3 h-3" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
