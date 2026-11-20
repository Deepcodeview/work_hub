'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, LayoutGrid, ChevronDown, Menu, CheckCircle2 } from './icons';
import { useNavigation } from './navigation-context';
import { api, getStoredUser, clearStoredSession } from '../lib/api';

export function Header() {
  const { toggleSidebar } = useNavigation();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearStoredSession();
    setProfileOpen(false);
    router.push('/login');
  };

  const displayName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : 'John Carter';
  const displayRole = user?.roles?.[0] ? user.roles[0].replace('_', ' ') : 'Software Engineer';
  const displayEmail = user?.email || 'admin@workhub.internal';

  return (
    <header className="h-16 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#F1ECE4] fixed top-0 right-0 left-0 lg:left-64 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-all duration-300">
      {/* Left Group: Hamburger on Mobile + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-[#64748B] hover:text-[#1F2937] hover:bg-[#F8F5F0] lg:hidden transition-colors shrink-0"
          title="Open Menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Pill Search Bar */}
        <div className="relative w-full">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#F6F3EE] hover:bg-[#F2EEE7] transition-colors rounded-full border border-[#EBE3D7]/80 text-sm text-[#8A94A6]">
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              placeholder="Search people, projects, tasks..."
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[#1F2937] placeholder-[#9CA3AF]"
            />
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-[#8A94A6] bg-white border border-[#E2DDD5] rounded-md shadow-xs shrink-0">
              ⌘ K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative" ref={menuRef}>
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-[#64748B] hover:text-[#1F2937] hover:bg-[#F8F5F0] transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF8A00] ring-2 ring-white"></span>
        </button>

        {/* Apps Grid */}
        <button
          className="p-2 rounded-xl text-[#64748B] hover:text-[#1F2937] hover:bg-[#F8F5F0] transition-colors hidden sm:flex"
          title="App Launcher"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-full hover:bg-[#F8F5F0] transition-colors cursor-pointer border border-transparent hover:border-[#EBE4D8]"
        >
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-gradient-to-tr from-[#FF981A] to-[#FFB766] flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0">
            {displayName[0]}
          </div>
          <div className="text-left hidden sm:block">
            <span className="font-semibold text-xs sm:text-sm text-[#1F2937] leading-tight block">
              {displayName}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#8A92A6] block leading-tight">
              {displayRole}
            </span>
          </div>
          <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#8A94A6] hidden sm:block" />
        </div>

        {/* Profile Dropdown Popover */}
        {profileOpen && (
          <div className="absolute top-14 right-0 w-64 bg-white rounded-3xl border border-[#F1ECE4] shadow-xl p-4 z-50 animate-in fade-in duration-150">
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
    </header>
  );
}
