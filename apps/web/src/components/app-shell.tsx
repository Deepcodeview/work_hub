'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { NavigationProvider } from './navigation-context';
import { getStoredToken } from '../lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname?.startsWith('/login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token && !isAuthPage) {
      setIsAuthenticated(false);
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, isAuthPage, router]);

  // Auth pages (login, reset, etc.) render standalone without shell chrome
  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center">
        {children}
      </main>
    );
  }

  // Strict Loading state while authentication is being verified
  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4 selection:bg-[#FFE2C8]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF981A] to-[#FF7A00] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/25 mb-4 animate-bounce">
          W
        </div>
        <div className="w-7 h-7 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#8A92A6] tracking-wide">
          Verifying secure session...
        </p>
      </div>
    );
  }

  return (
    <NavigationProvider>
      <Sidebar />
      <Header />
      <main className="pl-0 lg:pl-64 pt-16 pb-24 lg:pb-8 min-h-screen w-full touch-pan-y transition-all duration-300">
        <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      <MobileNav />
    </NavigationProvider>
  );
}
