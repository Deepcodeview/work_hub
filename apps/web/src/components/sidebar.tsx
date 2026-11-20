'use client';

import React, { useState, useEffect } from 'react';
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
import { getStoredUser } from '../lib/api';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useNavigation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
  }, []);

  interface NavItem {
    label: string;
    href: string;
    icon: any;
    badge?: number;
    roles?: string[]; // If specified, only users with one of these roles will see this item
  }

  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Attendance', href: '/attendance', icon: Clock },
    { label: 'Timesheet', href: '/timesheets', icon: FileText },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Team', href: '/team', icon: Users },
    {
      label: 'Approvals',
      href: '/approvals',
      icon: CheckCircle2,
      badge: 3,
      roles: ['SYSTEM_ADMIN', 'HR_ADMIN', 'DEPARTMENT_HEAD', 'REPORTING_MANAGER'],
    },
    {
      label: 'Reports',
      href: '/departments',
      icon: BarChart3,
      roles: ['SYSTEM_ADMIN', 'HR_ADMIN', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Organization',
      href: '/organization',
      icon: Building2,
      roles: ['SYSTEM_ADMIN', 'HR_ADMIN'],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['SYSTEM_ADMIN'],
    },
  ];

  // If roles exist on user, use them; default to SYSTEM_ADMIN for admin session
  const userRoles: string[] = user?.roles?.length ? user.roles : ['SYSTEM_ADMIN'];
  const isSuperAdmin = userRoles.includes('SYSTEM_ADMIN');

  // Filter items based on active user's roles
  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

  const roleTitle = isSuperAdmin
    ? 'System Admin'
    : userRoles[0]
    ? userRoles[0].replace('_', ' ')
    : 'Employee';

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
        className={`w-64 fixed top-16 left-0 bottom-0 h-[calc(100vh-4rem)] bg-[#FFFFFF] border-r border-[#F1ECE4] z-40 select-none overflow-hidden transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto flex-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-3">
          {/* Mobile Close Button (shown only when opened on mobile) */}
          <div className="px-4 py-1 flex items-center justify-between lg:hidden border-b border-[#F1ECE4] mb-2">
            <span className="text-xs font-bold text-[#8A92A6]">Menu</span>
            <button
              onClick={closeSidebar}
              className="p-1 rounded-xl text-[#8A92A6] hover:text-[#1F2937] hover:bg-[#FAF7F2] transition-colors"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items (Role-Filtered) */}
          <nav className="px-3.5 space-y-1">
            {visibleNavItems.map((item) => {
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

        {/* User Role Card at Bottom of Sidebar */}
        <div className="p-4 relative overflow-hidden shrink-0">
          <div className="w-full rounded-2xl bg-gradient-to-b from-[#FFF5EC] to-[#FFE8D1] border border-[#FDE1C5]/70 p-3.5 relative overflow-hidden flex flex-col justify-end shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold text-[#D96B00] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-orange-200">
                {isSuperAdmin ? '👑 Super Admin' : roleTitle}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            </div>

            <span className="text-xs font-bold text-[#1F2937] truncate block leading-tight">
              {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'System Administrator'}
            </span>
            <span className="text-[11px] text-[#8B4800]/80 truncate block">
              {user?.email || 'admin@workhub.internal'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
