'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { NavigationProvider } from './navigation-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname?.startsWith('/login');

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center">
        {children}
      </main>
    );
  }

  return (
    <NavigationProvider>
      <Sidebar />
      <Header />
      <main className="pl-0 lg:pl-64 pt-16 pb-20 lg:pb-8 min-h-screen transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      <MobileNav />
    </NavigationProvider>
  );
}
