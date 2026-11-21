import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '../components/app-shell';
import { PwaRegister } from '../components/pwa-register';

export const metadata: Metadata = {
  title: 'WorkHub — Workforce Operating System',
  description: 'Enterprise workforce operations, attendance, timesheets, and project management',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192' },
      { url: '/icons/icon-512.png', sizes: '512x512' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WorkHub',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FF7A00',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FBF9F5] text-[#1F2937] font-sans antialiased selection:bg-[#FFE2C8] selection:text-[#FF7A00] touch-pan-y">
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
