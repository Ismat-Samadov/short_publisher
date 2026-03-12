'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Youtube, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Shield,
} from 'lucide-react';

function YouTubeAuthContent() {
  const params = useSearchParams();
  const success = params.get('success') === 'true';
  const error   = params.get('error');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-400" />
          YouTube OAuth
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Connect your YouTube channel to enable automated video uploads
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-emerald-800/50 text-sm"
          style={{ background: 'rgba(16,185,129,0.06)' }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-emerald-300 font-medium">YouTube connected successfully</div>
            <div className="text-emerald-700 text-xs mt-0.5">
              Refresh token saved to Secrets. The pipeline can now upload videos.
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-800/50 text-sm"
          style={{ background: 'rgba(239,68,68,0.06)' }}>
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-300 font-medium">OAuth failed</div>
            <div className="text-red-700 text-xs mt-0.5 font-mono">{decodeURIComponent(error)}</div>
          </div>
        </div>
      )}

      {/* Prerequisites card */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Before you connect</h2>
        </div>

        <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
          <li>
            Create a Google Cloud project and enable the{' '}
            <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
              target="_blank" rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2 inline-flex items-center gap-0.5">
              YouTube Data API v3<ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>
            Create an OAuth consent screen (External, add your Gmail as a test user)
          </li>
          <li>
            Create OAuth credentials — application type must be <strong className="text-zinc-300">Web application</strong> (not Desktop app)
          </li>
          <li>
            Add <strong className="text-zinc-300">YOUTUBE_CLIENT_ID</strong> and{' '}
            <strong className="text-zinc-300">YOUTUBE_CLIENT_SECRET</strong> to{' '}
            <a href="/dashboard/secrets" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
              Dashboard → Secrets
            </a>
          </li>
          <li>
            In the OAuth credential, under <strong className="text-zinc-300">Authorized redirect URIs</strong>, add this exact URI:
            <div className="mt-1.5 px-3 py-2 rounded-lg font-mono text-xs text-zinc-300 select-all break-all"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              {typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/api/auth/youtube/callback
            </div>
            <div className="mt-1 text-xs text-yellow-600">
              The URI must match exactly — including protocol (http vs https) and domain.
            </div>
          </li>
        </ol>

        <div className="pt-2">
          <a
            href="/api/auth/youtube"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
          >
            <Youtube className="w-4 h-4" />
            Connect YouTube Channel
          </a>
          <p className="text-xs text-zinc-700 mt-2">
            You will be redirected to Google to grant upload and read permissions.
            The refresh token is stored in NeonDB — never in environment variables.
          </p>
        </div>
      </div>

      {/* What this does */}
      <div className="rounded-xl border p-5 space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold text-zinc-200">What permissions are requested</h2>
        <div className="space-y-2 text-sm text-zinc-500">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span><strong className="text-zinc-400">youtube.upload</strong> — upload videos to your channel</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span><strong className="text-zinc-400">youtube.readonly</strong> — fetch view/like/comment stats for the Videos page</span>
          </div>
        </div>
      </div>

      {/* Reconnect note */}
      <div className="flex items-start gap-2 text-xs text-zinc-700 px-1">
        <RefreshCw className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          If the token expires or you change channels, click Connect again to generate a fresh token.
          The old one will be overwritten.
        </span>
      </div>
    </div>
  );
}

export default function YouTubeAuthPage() {
  return (
    <Suspense>
      <YouTubeAuthContent />
    </Suspense>
  );
}
