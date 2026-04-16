'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  HardDrive,
  Film,
  Image as ImageIcon,
  FileText,
  File,
  Trash2,
  Download,
  RefreshCw,
  Upload,
  Eye,
  X,
  Database,
  AlertCircle,
  ChevronRight,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface R2File {
  key: string;
  size: number;
  lastModified: string;
  url: string;
  inDb: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileType(key: string): 'video' | 'image' | 'audio' | 'other' {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  return 'other';
}

function FileTypeIcon({ fileKey, className }: { fileKey: string; className?: string }) {
  const type = getFileType(fileKey);
  const cls = cn('flex-shrink-0', className);
  if (type === 'video') return <Film className={cn(cls, 'text-violet-400')} />;
  if (type === 'image') return <ImageIcon className={cn(cls, 'text-blue-400')} />;
  if (type === 'audio') return <FileText className={cn(cls, 'text-emerald-400')} />;
  return <File className={cn(cls, 'text-zinc-500')} />;
}

function fileName(key: string) {
  return key.split('/').pop() ?? key;
}

function folderPath(key: string) {
  const parts = key.split('/');
  return parts.slice(0, -1).join('/');
}

// ── Preview Modal ──────────────────────────────────────────────────────────────
function PreviewModal({ file, onClose }: { file: R2File; onClose: () => void }) {
  const type = getFileType(file.key);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <FileTypeIcon fileKey={file.key} className="w-4 h-4" />
            <span className="text-sm font-medium text-zinc-200 truncate">{fileName(file.key)}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-all"
            >
              <Download className="w-3 h-3" />
              Open
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-5">
          {type === 'video' && (
            <video
              src={file.url}
              controls
              autoPlay
              className="w-full rounded-lg max-h-[70vh]"
              style={{ background: '#000' }}
            />
          )}
          {type === 'image' && (
            <img
              src={file.url}
              alt={fileName(file.key)}
              className="w-full rounded-lg max-h-[70vh] object-contain"
            />
          )}
          {(type === 'audio' || type === 'other') && (
            <div className="py-10 text-center space-y-3">
              <FileTypeIcon fileKey={file.key} className="w-12 h-12 mx-auto" />
              <p className="text-sm text-zinc-500">No preview available</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white gradient-accent hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Open file
              </a>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-5 px-5 py-3 text-xs text-zinc-600" style={{ borderTop: '1px solid var(--border)' }}>
          <span>{formatBytes(file.size)}</span>
          <span>·</span>
          <span>{format(new Date(file.lastModified), 'MMM d, yyyy HH:mm')}</span>
          <span>·</span>
          <span className="font-mono text-zinc-700 truncate">{file.key}</span>
        </div>
      </div>
    </div>
  );
}

// ── Upload Panel ───────────────────────────────────────────────────────────────
function UploadPanel({ onUploaded }: { onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [prefix, setPrefix] = useState('uploads');
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('prefix', prefix);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Uploaded: ${data.key}` });
        onUploaded();
      } else {
        setResult({ ok: false, message: data.error ?? 'Upload failed' });
      }
    } catch {
      setResult({ ok: false, message: 'Network error' });
    } finally {
      setUploading(false);
      setTimeout(() => setResult(null), 5000);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    uploadFile(files[0]);
  }

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-semibold text-zinc-200">Upload File</span>
      </div>

      {/* Prefix input */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Destination folder (prefix)</label>
        <input
          value={prefix}
          onChange={(e) => setPrefix(e.target.value.replace(/^\/|\/$/g, ''))}
          placeholder="uploads"
          className="w-full sm:max-w-xs text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg-2)' }}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl py-10 text-center cursor-pointer transition-all',
          dragging ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700 hover:bg-white/[0.02]'
        )}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin-slow" />
            <p className="text-sm text-zinc-500">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-zinc-600" />
            <p className="text-sm text-zinc-500">Drop a file here or click to browse</p>
            <p className="text-xs text-zinc-700">Video, image, audio (max ~500 MB via this UI)</p>
          </div>
        )}
      </div>

      {result && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs border',
          result.ok ? 'text-emerald-300 border-emerald-800/50' : 'text-red-300 border-red-800/50'
        )}
          style={{ background: result.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="break-all">{result.message}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StoragePage() {
  const [files, setFiles] = useState<R2File[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [isTruncated, setIsTruncated] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<R2File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState('');

  const fetchFiles = useCallback(async (pfx = prefix, token?: string) => {
    if (!token) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (pfx) params.set('prefix', pfx);
      if (token) params.set('token', token);
      const res = await fetch(`/api/storage/files?${params}`);
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to load'); return; }
      const data = await res.json();
      setFiles(token ? (prev) => [...prev, ...data.files] : data.files);
      setNextToken(data.nextToken);
      setIsTruncated(data.isTruncated);
    } finally {
      setLoading(false);
    }
  }, [prefix]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function handleDelete(key: string) {
    if (!confirm(`Delete "${key.split('/').pop()}"? This cannot be undone.`)) return;
    setDeletingKey(key);
    try {
      const res = await fetch(`/api/storage/files?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      if (res.ok) setFiles((prev) => prev.filter((f) => f.key !== key));
    } finally {
      setDeletingKey(null);
    }
  }

  function navigatePrefix(newPrefix: string) {
    setPrefix(newPrefix);
    setFiles([]);
    setNextToken(undefined);
    fetchFiles(newPrefix);
  }

  // Compute stats
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const orphaned = files.filter((f) => !f.inDb && getFileType(f.key) === 'video').length;
  const videos = files.filter((f) => getFileType(f.key) === 'video').length;

  // Build breadcrumbs from prefix
  const breadcrumbs = prefix ? prefix.split('/').filter(Boolean) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Storage</h1>
          <p className="text-zinc-500 text-sm mt-1">Cloudflare R2 file management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button
            onClick={() => fetchFiles()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin-slow')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!loading && files.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-semibold text-zinc-300">{formatBytes(totalSize)}</span> used
          </span>
          <span className="text-zinc-800">·</span>
          <span><span className="font-semibold text-zinc-300">{files.length}</span> files</span>
          <span className="text-zinc-800">·</span>
          <span><span className="font-semibold text-violet-400">{videos}</span> videos</span>
          {orphaned > 0 && (
            <>
              <span className="text-zinc-800">·</span>
              <span className="flex items-center gap-1 text-amber-400">
                <AlertCircle className="w-3 h-3" />
                <span className="font-semibold">{orphaned}</span> orphaned
              </span>
            </>
          )}
        </div>
      )}

      {/* Upload panel */}
      {showUpload && (
        <UploadPanel onUploaded={() => { setShowUpload(false); fetchFiles(); }} />
      )}

      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 text-xs text-zinc-600 flex-wrap">
        <button
          onClick={() => navigatePrefix('')}
          className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
        >
          <Home className="w-3 h-3" />
          <span>Bucket root</span>
        </button>
        {breadcrumbs.map((crumb, i) => {
          const crumbPrefix = breadcrumbs.slice(0, i + 1).join('/');
          return (
            <span key={crumbPrefix} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-zinc-800" />
              <button
                onClick={() => navigatePrefix(crumbPrefix + '/')}
                className="hover:text-zinc-300 transition-colors"
              >
                {crumb}
              </button>
            </span>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-800/50"
          style={{ background: 'rgba(239,68,68,0.06)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* File list */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin-slow" />
            <p className="text-sm text-zinc-600">Loading files…</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <HardDrive className="w-10 h-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">No files found{prefix ? ` in "${prefix}"` : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['File', 'Folder', 'Size', 'Modified', 'DB', ''].map((h) => (
                    <th key={h} className="text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr
                    key={file.key}
                    className="group hover:bg-zinc-800/30 transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {/* Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileTypeIcon fileKey={file.key} className="w-4 h-4" />
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[180px] sm:max-w-[260px]">
                          {fileName(file.key)}
                        </span>
                      </div>
                    </td>

                    {/* Folder */}
                    <td className="px-5 py-3">
                      {folderPath(file.key) ? (
                        <button
                          onClick={() => navigatePrefix(folderPath(file.key) + '/')}
                          className="text-xs text-zinc-600 hover:text-violet-400 transition-colors font-mono truncate max-w-[120px]"
                        >
                          {folderPath(file.key)}/
                        </button>
                      ) : (
                        <span className="text-zinc-800 text-xs">—</span>
                      )}
                    </td>

                    {/* Size */}
                    <td className="px-5 py-3">
                      <span className="text-xs text-zinc-500">{formatBytes(file.size)}</span>
                    </td>

                    {/* Modified */}
                    <td className="px-5 py-3">
                      <span
                        className="text-xs text-zinc-600"
                        title={format(new Date(file.lastModified), 'PPpp')}
                      >
                        {formatDistanceToNow(new Date(file.lastModified), { addSuffix: true })}
                      </span>
                    </td>

                    {/* DB linked */}
                    <td className="px-5 py-3">
                      {file.inDb ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                          <Database className="w-3 h-3" />
                          Linked
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-700">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 text-zinc-600 hover:text-blue-400 hover:bg-blue-950/30 rounded-lg transition-all"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-600 hover:text-violet-400 hover:bg-violet-950/30 rounded-lg transition-all"
                          title="Open"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(file.key)}
                          disabled={deletingKey === file.key}
                          className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingKey === file.key
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load more */}
        {isTruncated && nextToken && (
          <div className="px-5 py-3 flex justify-center" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => fetchFiles(prefix, nextToken)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Load more files…
            </button>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
