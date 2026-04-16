'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/StatusBadge';
import TopicForm from '../../components/TopicForm';
import { Plus, Trash2, RefreshCw, ListTodo, Tag, ArrowUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Topic {
  id: string;
  title: string;
  description: string | null;
  niche: string | null;
  keywords: string[] | null;
  status: 'queued' | 'processing' | 'used' | 'skipped';
  priority: number;
  created_at: string;
  updated_at: string;
}

type FilterStatus = 'all' | 'queued' | 'processing' | 'used' | 'skipped';

const filters: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Queued', value: 'queued' },
  { label: 'Processing', value: 'processing' },
  { label: 'Used', value: 'used' },
  { label: 'Skipped', value: 'skipped' },
];

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/topics' : `/api/topics?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) setTopics(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this topic? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' });
      if (res.ok) setTopics((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(id: string, status: Topic['status']) {
    const res = await fetch(`/api/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTopics((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }

  const queued = topics.filter((t) => t.status === 'queued').length;
  const used = topics.filter((t) => t.status === 'used').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Topics</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage the content queue for your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTopics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin-slow')} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="text-zinc-200 font-semibold">{topics.length}</span>
          <span className="text-zinc-600 ml-1">total</span>
        </div>
        <div className="w-px h-4 bg-zinc-800" />
        <div className="text-sm">
          <span className="text-amber-400 font-semibold">{queued}</span>
          <span className="text-zinc-600 ml-1">queued</span>
        </div>
        <div className="w-px h-4 bg-zinc-800" />
        <div className="text-sm">
          <span className="text-emerald-400 font-semibold">{used}</span>
          <span className="text-zinc-600 ml-1">used</span>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <TopicForm
          onClose={() => {
            setShowForm(false);
            fetchTopics();
          }}
        />
      )}

      {/* Filter tabs */}
      <div className="overflow-x-auto">
      <div
        className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {filters.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              filter === value
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>
      </div>

      {/* Topics list */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin-slow" />
            <p className="text-sm text-zinc-600">Loading topics…</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <ListTodo className="w-8 h-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">No topics found</p>
            <p className="text-xs text-zinc-700">
              {filter !== 'all' ? 'Try a different filter' : 'Click "Add Topic" to create your first one'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Topic', 'Niche', 'Keywords', 'Status', 'Priority', 'Created', ''].map((h) => (
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
              {topics.map((topic) => (
                <tr
                  key={topic.id}
                  className="group hover:bg-zinc-800/30 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  {/* Title */}
                  <td className="px-5 py-3.5 max-w-xs">
                    <div className="text-sm font-medium text-zinc-200 truncate">{topic.title}</div>
                    {topic.description && (
                      <div className="text-xs text-zinc-600 mt-0.5 truncate max-w-[220px]">
                        {topic.description}
                      </div>
                    )}
                  </td>

                  {/* Niche */}
                  <td className="px-5 py-3.5">
                    {topic.niche ? (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800/60 border border-zinc-700/60 px-2 py-0.5 rounded-md">
                        <Tag className="w-2.5 h-2.5" />
                        {topic.niche}
                      </span>
                    ) : (
                      <span className="text-zinc-700 text-xs">—</span>
                    )}
                  </td>

                  {/* Keywords */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(topic.keywords ?? []).slice(0, 2).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500 border"
                          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                        >
                          {kw}
                        </span>
                      ))}
                      {(topic.keywords ?? []).length > 2 && (
                        <span className="text-[10px] text-zinc-700">
                          +{(topic.keywords ?? []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={topic.status} />
                      <select
                        value={topic.status}
                        onChange={(e) => handleStatusChange(topic.id, e.target.value as Topic['status'])}
                        className={cn(
                          'text-[10px] bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-400 focus:outline-none transition-opacity cursor-pointer',
                          topic.status === 'processing' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                      >
                        {(['queued', 'processing', 'used', 'skipped'] as Topic['status'][]).map((s) => (
                          <option key={s} value={s} style={{ background: '#18181b' }}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-3.5">
                    {topic.priority > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                        <ArrowUp className="w-3 h-3" />
                        {topic.priority}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">0</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-zinc-600">
                      {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(topic.id)}
                      disabled={deletingId === topic.id}
                      className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-40 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
