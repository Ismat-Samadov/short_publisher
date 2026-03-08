'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  Film,
  Zap,
  Settings,
  PlayCircle,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/topics', label: 'Topics', icon: ListTodo, exact: false },
      { href: '/dashboard/videos', label: 'Videos', icon: Film, exact: false },
    ],
  },
  {
    label: 'Automation',
    items: [
      { href: '/dashboard/pipeline', label: 'Pipeline', icon: PlayCircle, exact: false },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
    ],
  },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
        isActive
          ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4 flex-shrink-0 transition-colors',
          isActive ? 'text-violet-400' : 'text-zinc-600 group-hover:text-zinc-400'
        )}
      />
      <span className="flex-1">{label}</span>
      {isActive && (
        <ChevronRight className="w-3 h-3 text-violet-500/60" />
      )}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-20"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 glow-accent">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">Short Publisher</div>
            <div className="text-xs text-zinc-600">Autonomous pipeline</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700">
                {section.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/60 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Documentation
        </a>
        <div className="px-3 flex items-center justify-between">
          <span className="text-[10px] text-zinc-700">v0.1.0</span>
          <span className="text-[10px] text-zinc-700">YT Shorts AI</span>
        </div>
      </div>
    </aside>
  );
}
