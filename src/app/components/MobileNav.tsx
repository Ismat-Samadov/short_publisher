'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  Film,
  Settings,
  PlayCircle,
  KeyRound,
  HardDrive,
  Zap,
  LogOut,
  Menu,
  X,
  Radio,
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
      { href: '/dashboard/secrets', label: 'Secrets', icon: KeyRound, exact: false },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { href: '/dashboard/storage', label: 'Storage', icon: HardDrive, exact: false },
    ],
  },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 glow-accent">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-zinc-100">Short Publisher</span>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-[260px] z-50 flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 glow-accent">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-zinc-100 leading-tight">Short Publisher</div>
              <div className="text-[10px] text-zinc-600 leading-tight mt-0.5">AI Video Pipeline</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-700">
                  {section.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon, exact }) => {
                  const isActive = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all',
                        isActive
                          ? 'text-violet-200 bg-violet-500/10'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-400" />
                      )}
                      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-violet-400' : 'text-zinc-600')} />
                      <span className="font-medium">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status chip */}
        <div className="px-4 pb-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] text-zinc-500">Daily · 09:00 UTC</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-2.5 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
