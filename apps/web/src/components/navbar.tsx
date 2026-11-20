'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@workhub/ui';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Overview', href: '/' },
    { label: 'Directory', href: '/directory' },
    { label: 'Org Chart', href: '/organization' },
    { label: 'Departments', href: '/departments' },
    { label: 'Projects', href: '/projects' },
    { label: 'Chat', href: '/chat' },
    { label: 'Mail', href: '/mail' },
    { label: 'Calendar', href: '/calendar' },
    { label: 'Docs', href: '/documents' },
    { label: 'Leave', href: '/leave' },
    { label: 'Payroll', href: '/payroll' },
    { label: 'Automations', href: '/automations' },
    { label: 'Attendance', href: '/attendance' },
    { label: 'Timesheets', href: '/timesheets' },
    { label: 'Approvals', href: '/approvals' },
  ];

  return (
    <header className="border-b border-[#F1E9E0] bg-[#FFFFFF]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF8A00] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              W
            </div>
            <span className="font-semibold text-lg text-[#1F2937] tracking-tight">WorkHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#FFF3E8] text-[#FF8A00]'
                      : 'text-[#64748B] hover:text-[#1F2937] hover:bg-[#FFFAF5]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('No unread notifications')}
            className="p-1.5 text-[#64748B] hover:text-[#1F2937] hover:bg-[#F8FAFC] rounded-md transition-colors relative"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <Badge status="success">Active</Badge>
          <Link
            href="/login"
            className="text-xs font-medium text-[#FF8A00] hover:text-[#E67C00] px-3 py-1.5 border border-[#FFE4CC] rounded-md bg-[#FFF3E8]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
