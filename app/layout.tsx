import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Timberman — Chop the Tree!',
  description:
    'Fast-paced arcade game: chop left and right to cut down the tree, but dodge the branches! Built with Next.js, TypeScript & Tailwind CSS.',
  keywords: ['timberman', 'game', 'arcade', 'next.js', 'typescript'],
  authors: [{ name: 'Timberman Game' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050d0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
