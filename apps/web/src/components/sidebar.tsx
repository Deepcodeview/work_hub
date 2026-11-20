'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Clock,
  FileText,
  FolderKanban,
  CheckSquare,
  Users,
  CheckCircle2,
  BarChart3,
  Building2,
  Settings,
  X,
} from './icons';
import { useNavigation } from './navigation-context';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useNavigation();

  interface NavItem {
    label: string;
    href: string;
    icon: any;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Attendance', href: '/attendance', icon: Clock },
    { label: 'Timesheet', href: '/timesheets', icon: FileText },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Team', href: '/team', icon: Users },
    { label: 'Approvals', href: '/approvals', icon: CheckCircle2 },
    { label: 'Reports', href: '/departments', icon: BarChart3 },
    { label: 'Organization', href: '/organization', icon: Building2 },
    { label: 'Settings', href: '/automations', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        className={`w-64 h-screen bg-[#FFFFFF] border-r border-[#F1ECE4] flex flex-col justify-between fixed top-0 left-0 z-50 select-none transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto flex-1 no-scrollbar">
          {/* Brand Logo Header & Mobile Close Button */}
          <div className="p-6 pb-4 flex items-center justify-between">
            <Link href="/" onClick={closeSidebar} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF981A] to-[#FF7A00] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-orange-500/20 shrink-0">
                W
              </div>
              <div>
                <span className="font-bold text-lg text-[#1F2937] tracking-tight block leading-tight">
                  Work Hub
                </span>
                <span className="text-[11px] font-medium text-[#94A3B8] tracking-normal block">
                  Workforce Management
                </span>
              </div>
            </Link>

            {/* Close Button on Mobile */}
            <button
              onClick={closeSidebar}
              className="p-1.5 rounded-xl text-[#8A92A6] hover:text-[#1F2937] hover:bg-[#FAF7F2] lg:hidden transition-colors"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3.5 space-y-1 mt-2">
            {navItems.map((item) => {
              const currentPath = pathname || '';
              const isActive =
                item.href === '/'
                  ? currentPath === '/'
                  : currentPath === item.href || currentPath.startsWith(item.href + '/');

              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FFF0E0] text-[#FF7A00] font-semibold shadow-xs'
                      : 'text-[#64748B] hover:text-[#1F2937] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#FF7A00]' : 'text-[#8A94A6]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="w-5 h-5 rounded-full bg-[#FF8A00] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Warm Mountain / Sunrise Illustration at Bottom of Sidebar */}
        <div className="p-4 relative overflow-hidden shrink-0">
          <div className="w-full h-28 rounded-2xl bg-gradient-to-b from-[#FFF5EC] to-[#FFE8D1] border border-[#FDE1C5]/60 p-4 relative overflow-hidden flex flex-col justify-end shadow-inner">
            {/* Subtle sun */}
            <div className="absolute top-2 right-4 w-9 h-9 rounded-full bg-[#FFB86B]/40 blur-xs"></div>
            {/* Layered mountain shapes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 200 120"
              fill="none"
            >
              {/* Distant mountain layer */}
              <path
                d="M -10,120 L 40,65 L 110,120 Z"
                fill="#FFCCA0"
                opacity="0.45"
              />
              <path
                d="M 60,120 L 130,50 L 210,120 Z"
                fill="#FFB67E"
                opacity="0.5"
              />
              {/* Foreground mountain layers */}
              <path
                d="M 10,120 L 80,75 L 160,120 Z"
                fill="#FFA561"
                opacity="0.6"
              />
              <path
                d="M 90,120 L 160,70 L 220,120 Z"
                fill="#FF9447"
                opacity="0.65"
              />
              <path
                d="M -20,120 L 50,85 L 120,120 Z"
                fill="#FF832E"
                opacity="0.75"
              />
            </svg>

            <div className="relative z-10">
              <span className="text-[11px] font-bold text-[#D96B00] uppercase tracking-wider block">
                WorkHub Pro
              </span>
              <span className="text-xs font-semibold text-[#8B4800]">
                All systems online
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
