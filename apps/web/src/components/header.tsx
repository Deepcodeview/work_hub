'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  LayoutGrid,
  ChevronDown,
  Menu,
  CheckCircle2,
  Clock,
  Home,
  FileText,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  Building2,
  Settings,
  Calendar,
  X,
  Sparkles,
} from './icons';
import { useNavigation } from './navigation-context';
import { api, getStoredUser, clearStoredSession } from '../lib/api';
import { CommandPalette } from './command-palette';

export function Header() {
  const { toggleSidebar } = useNavigation();
  const router = useRouter();

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // User state
  const [user, setUser] = useState<any>(null);

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Workspace Active',
      message: 'Welcome to WorkHub. PostgreSQL and backend services are operational.',
      time: 'Just now',
      unread: true,
      type: 'system',
    },
    {
      id: 'notif-2',
      title: 'Attendance Reminder',
      message: 'Remember to track your daily shifts with the live digital clock.',
      time: 'Today',
      unread: true,
      type: 'attendance',
    },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setAppsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Command Palette shortcut (⌘ K / Ctrl + K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = () => {
    clearStoredSession();
    setProfileOpen(false);
    router.push('/login');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const displayName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : 'System Admin';
  const displayRole = user?.roles?.[0] ? user.roles[0].replace('_', ' ') : 'Administrator';
  const displayEmail = user?.email || 'admin@workhub.internal';

  // Quick Launcher Applications
  const apps = [
    { name: 'Home', href: '/', icon: Home, color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { name: 'Attendance', href: '/attendance', icon: Clock, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { name: 'Timesheets', href: '/timesheets', icon: FileText, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { name: 'Projects', href: '/projects', icon: FolderKanban, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { name: 'Team', href: '/team', icon: Users, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { name: 'Reports', href: '/departments', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { name: 'Organization', href: '/organization', icon: Building2, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, color: 'bg-violet-50 text-violet-600 border-violet-100' },
    { name: 'Documents', href: '/documents', icon: FileText, color: 'bg-sky-50 text-sky-600 border-sky-100' },
    { name: 'Chat', href: '/chat', icon: Sparkles, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  ];

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#F1ECE4] fixed top-0 right-0 left-0 w-full z-50 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-all duration-300">
      {/* Left Group: Hamburger on Mobile + Brand Logo */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-[#64748B] hover:text-[#1F2937] hover:bg-[#F8F5F0] lg:hidden transition-colors shrink-0"
          title="Open Menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo Header matching reference */}
        <Link href="/" className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF981A] to-[#FF7A00] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-orange-500/20 shrink-0">
            W
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-base sm:text-lg text-[#1F2937] tracking-tight block leading-tight">
              Work Hub
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#94A3B8] tracking-normal block">
              Workforce Management
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Search Bar (Triggers Command Palette) */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-6">
        <div className="relative w-full">
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 bg-[#F6F3EE] hover:bg-[#F2EEE7] transition-colors rounded-full border border-[#EBE3D7]/80 text-sm text-[#8A94A6] cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              readOnly
              placeholder="Search people, projects, tasks... (or press ⌘ K)"
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[#1F2937] placeholder-[#9CA3AF] cursor-pointer"
            />
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-[#8A94A6] bg-white border border-[#E2DDD5] rounded-md shadow-xs shrink-0">
              ⌘ K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative" ref={containerRef}>
        {/* 1. Notification Bell Button */}
        <button
          onClick={() => {
            setNotificationsOpen(!notificationsOpen);
            setAppsOpen(false);
            setProfileOpen(false);
          }}
          className={`relative p-2 rounded-xl transition-colors ${
            notificationsOpen
              ? 'bg-[#FFF0E0] text-[#FF7A00]'
              : 'text-[#64748B] hover:text-[#1F2937] hover:bg-[#F8F5F0]'
          }`}
          title="Notifications"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#FF7A00] ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* 2. Apps Launcher / Grid Button */}
        <button
          onClick={() => {
            setAppsOpen(!appsOpen);
            setNotificationsOpen(false);
            setProfileOpen(false);
          }}
          className={`p-2 rounded-xl transition-colors ${
            appsOpen
              ? 'bg-[#FFF0E0] text-[#FF7A00]'
              : 'text-[#64748B] hover:text-[#1F2937] hover:bg-[#F8F5F0]'
          }`}
          title="WorkHub App Launcher"
          aria-label="Open application launcher"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        {/* 3. User Profile Pill */}
        <div
          onClick={() => {
            setProfileOpen(!profileOpen);
            setNotificationsOpen(false);
            setAppsOpen(false);
          }}
          className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-full hover:bg-[#F8F5F0] transition-colors cursor-pointer border border-transparent hover:border-[#EBE4D8]"
        >
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-gradient-to-tr from-[#FF981A] to-[#FFB766] flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0">
            {displayName[0]}
          </div>
          <div className="text-left hidden sm:block">
            <span className="font-semibold text-xs sm:text-sm text-[#1F2937] leading-tight block">
              {displayName}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8A92A6] block leading-tight uppercase tracking-wider">
              {displayRole.toUpperCase()}
            </span>
          </div>
          <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#8A94A6] hidden sm:block" />
        </div>

        {/* -------------------- NOTIFICATIONS DROPDOWN -------------------- */}
        {notificationsOpen && (
          <div className="absolute top-14 right-8 sm:right-16 w-80 sm:w-96 bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl p-4 z-50 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4] mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#FF7A00]" />
                <h3 className="font-bold text-sm text-[#1F2937]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF0E0] text-[#FF7A00] font-bold text-[10px]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-semibold text-[#FF7A00] hover:text-[#E66E00]"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1 rounded-full text-[#9CA3AF] hover:text-[#1F2937]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8 text-[#8A92A6]">
                <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-xs text-[#1F2937]">All caught up!</p>
                <p className="text-[11px]">No unread alerts or notifications.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border transition-colors ${
                      n.unread
                        ? 'bg-[#FFFBF5] border-[#FED7AA]'
                        : 'bg-white border-[#F3EFEA] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-[#1F2937] block">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] shrink-0">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="pt-2 mt-2 border-t border-[#F1ECE4] flex justify-between items-center text-xs">
                <button
                  onClick={clearAllNotifications}
                  className="text-[11px] font-medium text-[#9CA3AF] hover:text-[#DC2626]"
                >
                  Clear all
                </button>
                <Link
                  href="/attendance"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] font-semibold text-[#FF7A00] hover:underline"
                >
                  View Activity Logs →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* -------------------- APPS LAUNCHER DROPDOWN -------------------- */}
        {appsOpen && (
          <div className="absolute top-14 right-4 sm:right-12 w-80 sm:w-96 bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl p-5 z-50 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4] mb-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#FF7A00]" />
                <h3 className="font-bold text-sm text-[#1F2937]">WorkHub Apps & Services</h3>
              </div>
              <button
                onClick={() => setAppsOpen(false)}
                className="p-1 rounded-full text-[#9CA3AF] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-h-96 overflow-y-auto no-scrollbar">
              {apps.map((app) => {
                const IconComponent = app.icon;
                return (
                  <Link
                    key={app.name}
                    href={app.href}
                    onClick={() => setAppsOpen(false)}
                    className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-[#FAF7F2] transition-all group"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 group-active:scale-95 mb-2 ${app.color}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-[#1F2937] leading-tight block">
                      {app.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-[#F1ECE4] text-center">
              <span className="text-[11px] text-[#8A92A6]">
                Single Sign-On Connected • WorkHub Suite
              </span>
            </div>
          </div>
        )}

        {/* -------------------- USER PROFILE DROPDOWN -------------------- */}
        {profileOpen && (
          <div className="absolute top-14 right-0 w-64 bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl p-4 z-50 animate-in fade-in duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1ECE4] mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF981A] to-[#FFB766] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                {displayName[0]}
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-sm text-[#1F2937] block leading-tight truncate">
                  {displayName}
                </span>
                <span className="text-[11px] text-[#8A92A6] block truncate">
                  {displayEmail}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                href="/team"
                onClick={() => setProfileOpen(false)}
                className="w-full px-3 py-2 text-xs font-semibold text-[#1F2937] hover:bg-[#FAF7F2] rounded-xl flex items-center justify-between transition-colors"
              >
                <span>My Profile & Team</span>
                <span className="text-[10px] text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
                  Active
                </span>
              </Link>
              <Link
                href="/login"
                onClick={() => setProfileOpen(false)}
                className="w-full px-3 py-2 text-xs font-semibold text-[#1F2937] hover:bg-[#FAF7F2] rounded-xl flex items-center justify-between transition-colors"
              >
                <span>Switch Account</span>
                <span className="text-[10px] text-[#FF8A00] bg-[#FFF0E0] px-2 py-0.5 rounded-full">
                  Sign In
                </span>
              </Link>
            </div>

            <div className="pt-2 mt-2 border-t border-[#F1ECE4]">
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl text-left transition-colors flex items-center justify-between"
              >
                <span>Sign Out</span>
                <span className="text-xs">➔</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Command Palette (⌘ K) Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </header>
  );
}
