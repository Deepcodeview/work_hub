import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '../components/app-shell';

export const metadata: Metadata = {
  title: 'WorkHub — Workforce Operating System',
  description: 'Enterprise workforce operations, attendance, timesheets, and project management',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF7A00',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FBF9F5] text-[#1F2937] font-sans antialiased selection:bg-[#FFE2C8] selection:text-[#FF7A00] overscroll-none">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
