'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, FileText, FolderKanban, CheckSquare, Users } from './icons';

export function MobileNav() {
  const pathname = usePathname() || '';

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Attendance', href: '/attendance', icon: Clock },
    { label: 'Timesheet', href: '/timesheets', icon: FileText },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F1ECE4] px-2 py-1.5 flex items-center justify-around shadow-lg">
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
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-[#FF7A00] font-bold'
                : 'text-[#8A92A6] hover:text-[#1F2937]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isActive ? 'bg-[#FFF0E0]' : ''
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
