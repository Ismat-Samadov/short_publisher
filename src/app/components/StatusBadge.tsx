import { cn } from '@/lib/utils';

type Status =
  | 'queued'
  | 'processing'
  | 'used'
  | 'skipped'
  | 'pending'
  | 'generating'
  | 'uploading'
  | 'published'
  | 'failed';

const statusConfig: Record<Status, { label: string; dot: string; badge: string; pulse?: boolean }> = {
  queued: {
    label: 'Queued',
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
  },
  processing: {
    label: 'Processing',
    dot: 'bg-blue-400',
    badge: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    pulse: true,
  },
  used: {
    label: 'Used',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  },
  skipped: {
    label: 'Skipped',
    dot: 'bg-amber-500',
    badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
  },
  generating: {
    label: 'Generating',
    dot: 'bg-violet-400',
    badge: 'bg-violet-950/60 text-violet-300 border-violet-800/60',
    pulse: true,
  },
  uploading: {
    label: 'Uploading',
    dot: 'bg-blue-400',
    badge: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    pulse: true,
  },
  published: {
    label: 'Published',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-red-500',
    badge: 'bg-red-950/60 text-red-300 border-red-800/60',
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showDot?: boolean;
}

export default function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border',
        config.badge,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            config.dot,
            config.pulse && 'animate-pulse-dot'
          )}
        />
      )}
      {config.label}
    </span>
  );
}
