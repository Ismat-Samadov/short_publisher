import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Short Publisher',
    template: '%s · Short Publisher',
  },
  description: 'Autonomous YouTube Shorts publishing pipeline',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        {children}
      </body>
    </html>
  );
}
