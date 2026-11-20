'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, FileText, CheckSquare, Users } from './icons';

export function MobileNav() {
  const pathname = usePathname() || '';

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Attendance', href: '/attendance', icon: Clock },
    { label: 'Timesheet', href: '/timesheets', icon: FileText },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Team', href: '/team', icon: Users },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#F1ECE4] px-1.5 py-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,8px)]">
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/'
            ? pathname === '/'
            : pathname === tab.href || pathname.startsWith(tab.href + '/');
        const Icon = tab.icon;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-[#FF7A00] font-semibold'
                : 'text-[#8A92A6] hover:text-[#1F2937]'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#FFF0E0] shadow-xs text-[#FF7A00] scale-105'
                  : 'text-[#8A92A6]'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
