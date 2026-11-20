import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '../components/app-shell';

export const metadata: Metadata = {
  title: 'WorkHub — Workforce Management Platform',
  description: 'Integrated operations, attendance, timesheets, and projects platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FBF9F5] text-[#1F2937] font-sans antialiased selection:bg-[#FFE2C8] selection:text-[#FF7A00]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
