'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  FolderGit2,
  CheckSquare,
  FileText,
  MapPin,
  Play,
  Pause,
  Check,
  ArrowRight,
  Sparkles,
  Mic,
  Send,
  Calendar,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Users,
  Plus,
  CreditCard,
  UserPlus,
  Building2,
  Settings,
  ShieldCheck,
  Coffee,
} from '../components/icons';
import { api, getStoredUser } from '../lib/api';
import { useAttendanceSync } from '../lib/attendance-sync';
import { WorkAssistantModal } from '../components/work-assistant-modal';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Authoritative Cross-Device Live Attendance Sync
  const {
    clockedIn,
    clockInTimestamp,
    onBreak,
    breakType,
    elapsedSeconds,
    completedMinutesToday,
    completedMinutesThisWeek,
    totalBreakMinutesToday,
    loading: syncLoading,
    syncing,
    lastSyncedAt,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    refresh: refreshAttendance,
  } = useAttendanceSync();

  // Live Telemetry Stats
  const [stats, setStats] = useState({
    activeProjects: 0,
    openTasks: 0,
    hoursThisWeek: '0h 00m',
    timesheetStatus: '0h 00m',
  });

  // Real backend entities
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // AI Copilot state
  const [prompt, setPrompt] = useState('');
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [modalInitialPrompt, setModalInitialPrompt] = useState('');

  // Keep digital clock live & current date dynamic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateStr(
        now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize user profile
  useEffect(() => {
    const user = getStoredUser();
    if (user) setCurrentUser(user);
  }, []);

  // Keep weekly hours synced with attendance
  useEffect(() => {
    if (typeof completedMinutesThisWeek === 'number') {
      const wHours = Math.floor(completedMinutesThisWeek / 60);
      const wMins = completedMinutesThisWeek % 60;
      setStats((prev) => ({
        ...prev,
        hoursThisWeek: `${wHours}h ${wMins.toString().padStart(2, '0')}m`,
      }));
    }
  }, [completedMinutesThisWeek]);

  // Fetch initial dashboard projects and tasks
  useEffect(() => {
    async function loadData() {
      // 1. Dashboard summary
      const dashRes = await api.dashboard.getSummary();
      if (dashRes.success && dashRes.data) {
        setStats((prev) => ({
          ...prev,
          activeProjects: dashRes.data.projects?.totalActive ?? prev.activeProjects,
          openTasks: dashRes.data.tasks?.totalOpen ?? prev.openTasks,
        }));
      }

      // 2. Projects
      const projRes = await api.projects.list();
      if (projRes.success && Array.isArray(projRes.data)) {
        setProjects(projRes.data);
        setStats((prev) => ({ ...prev, activeProjects: projRes.data.length }));

        // 3. Tasks from projects
        if (projRes.data.length > 0) {
          let allTasks: any[] = [];
          for (const p of projRes.data) {
            const tRes = await api.tasks.listByProject(p.id);
            if (tRes.success && Array.isArray(tRes.data)) {
              allTasks = [...allTasks, ...tRes.data];
            }
          }
          setTasks(allTasks);
          setStats((prev) => ({
            ...prev,
            openTasks: allTasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'DONE').length,
          }));
        }
      }

      // 4. Team members
      const teamRes = await api.organization.getEmployees();
      if (teamRes.success && Array.isArray(teamRes.data)) {
        setTeamMembers(teamRes.data);
      }
    }
    loadData();
  }, []);

  // Clock In / Out toggle using centralized server sync
  const handleToggleClock = async () => {
    if (!clockedIn) {
      const res = await clockIn();
      setNotification(res.message);
    } else {
      const res = await clockOut();
      setNotification(res.message);
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleToggleBreak = async () => {
    if (onBreak) {
      await endBreak();
      setNotification('Resumed work session from break.');
    } else {
      await startBreak('COFFEE');
      setNotification('Break started. Live work timer paused.');
    }
    setTimeout(() => setNotification(null), 4000);
  };

  // Timer calculations
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedSecs = elapsedSeconds % 60;

  const totalTodaySeconds = (completedMinutesToday * 60) + (clockedIn ? elapsedSeconds : 0);
  const totalTodayHours = Math.floor(totalTodaySeconds / 3600);
  const totalTodayMinutes = Math.floor((totalTodaySeconds % 3600) / 60);

  const displayHours = clockedIn ? elapsedHours : totalTodayHours;
  const displayMinutes = clockedIn ? elapsedMinutes : totalTodayMinutes;
  const displaySecs = clockedIn ? elapsedSecs : 0;

  const shiftTargetMinutes = 480; // 8 hours standard
  const totalWorkedMinutes = Math.floor(totalTodaySeconds / 60);
  const shiftProgressPercent = Math.min(100, Math.round((totalTodaySeconds / (shiftTargetMinutes * 60)) * 100));
  const remainingMinutes = Math.max(0, shiftTargetMinutes - totalWorkedMinutes);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMinsOnly = remainingMinutes % 60;

  const handleAskCopilot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setIsAssistantModalOpen(true);
      return;
    }
    setModalInitialPrompt(prompt.trim());
    setIsAssistantModalOpen(true);
    setPrompt('');
  };

  const openAssistantWithPrompt = (p: string) => {
    setModalInitialPrompt(p);
    setIsAssistantModalOpen(true);
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' || currentStatus === 'DONE' ? 'TODO' : 'COMPLETED';
    await api.tasks.update(taskId, { status: newStatus as any });
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const displayName = currentUser?.employee
    ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}`
    : 'Admin';

  const userRoles: string[] = currentUser?.roles?.length ? currentUser.roles : ['SYSTEM_ADMIN'];
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'DONE').length;

  return (
    <div className="space-y-6 max-w-full touch-pan-y">
      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-xs transition-all animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold ml-4 p-1">✕</button>
        </div>
      )}

      {/* Role-Based Quick Hub Strip */}
      {userRoles.includes('SYSTEM_ADMIN') && (
        <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-white dark:from-[#FF7A00]/10 dark:via-gray-800 dark:to-gray-900 border border-[#FFE2C8] dark:border-gray-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF981A] to-[#FF7A00] text-white flex items-center justify-center font-bold text-base shadow-sm">
              👑
            </div>
            <div>
              <span className="text-xs font-black text-[#1F2937] dark:text-white block">
                Super Admin Command Center
              </span>
              <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">
                Full privileges active • Enterprise management & multi-role governance
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/onboarding"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[11px] font-bold text-[#1F2937] dark:text-white border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Onboarding Hub</span>
            </Link>
            <Link
              href="/payroll"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[11px] font-bold text-[#1F2937] dark:text-white border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payroll Runs</span>
            </Link>
            <Link
              href="/organization"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[11px] font-bold text-[#1F2937] dark:text-white border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Organization</span>
            </Link>
            <Link
              href="/settings"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[11px] font-bold text-[#1F2937] dark:text-white border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              <span>Settings & Audit</span>
            </Link>
          </div>
        </div>
      )}

      {userRoles.includes('HR_ADMIN') && !userRoles.includes('SYSTEM_ADMIN') && (
        <div className="bg-gradient-to-r from-purple-50/80 via-pink-50/50 to-white dark:from-purple-950/20 dark:via-gray-800 dark:to-gray-900 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              HR
            </span>
            <div>
              <span className="text-xs font-black text-[#1F2937] dark:text-white block">
                HR Administrator Hub
              </span>
              <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">
                Employee onboarding, leaves & monthly payroll operations
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/onboarding"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[11px] font-bold text-[#1F2937] dark:text-white border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-purple-600" />
              <span>Onboard Employee</span>
            </Link>
            <Link
              href="/payroll"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[11px] font-bold text-[#1F2937] dark:text-white border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Run Payroll</span>
            </Link>
            <Link
              href="/approvals"
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[11px] font-bold text-[#1F2937] dark:text-white border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Approvals Queue</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Top Hero Section: Punch Clock + Today's Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Punch Clock Card (Cols 1-8) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF9F2] dark:from-[#111827] dark:via-[#1A2234] dark:to-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 sm:p-7 shadow-xs relative overflow-hidden transition-all">
          {/* Subtle Ambient Decorative Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF7A00]/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center md:items-start space-y-5 shrink-0 w-full relative z-10">
            {/* Top Status & Date Banner */}
            <div className="flex flex-wrap items-center justify-between w-full gap-2.5">
              {/* Session State Badge */}
              <div className="flex items-center gap-2">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    clockedIn
                      ? onBreak
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-[#F8FAFC] dark:bg-gray-800 border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-400'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    {clockedIn && !onBreak && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        clockedIn
                          ? onBreak
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  <span>
                    {clockedIn
                      ? onBreak
                        ? '☕ On Break'
                        : '● Active Work Session'
                      : '○ Shift Idle / Ready'}
                  </span>
                </div>
              </div>

              {/* Date, In-Time & Real-Time Sync Indicator */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-[#EBE4D8] dark:border-gray-700 text-[#1F2937] dark:text-gray-200 shadow-2xs">
                  <span>📅</span>
                  <span>{currentDateStr || 'Today'}</span>
                </span>

                {clockInTimestamp && (
                  <span className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-[#FF7A00] font-bold">
                    In: {new Date(clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}

                {/* Cloud Sync Button */}
                <button
                  onClick={() => refreshAttendance()}
                  disabled={syncing}
                  title="Cross-device sync: Click to refresh live attendance from server"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-[#E2E8F0] dark:border-gray-700 text-[10px] text-[#64748B] dark:text-gray-400 hover:text-[#FF7A00] hover:border-orange-300 transition-all active:scale-95 shadow-2xs"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Live Synced'}</span>
                  <span className={syncing ? 'animate-spin' : ''}>🔄</span>
                </button>
              </div>
            </div>

            {/* Live Work Stopwatch Card */}
            <div className="w-full flex flex-col items-center md:items-start p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-[#F1ECE4] dark:border-gray-800 shadow-xs">
              <div className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#8A92A6] dark:text-gray-400 uppercase tracking-wider">
                    {clockedIn
                      ? onBreak
                        ? 'Work Timer (Paused on Break)'
                        : 'Live Work Time Elapsed'
                      : completedMinutesToday > 0
                      ? "Today's Logged Work Time"
                      : 'Shift Stopwatch (Standard 8h)'}
                  </span>
                  {clockedIn && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">
                      Live
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#FF7A00]">
                  Target: 8h 00m
                </span>
              </div>

              {/* Digital Timer Blocks (Hours : Minutes : Seconds) */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 font-mono my-2 w-full justify-center">
                {/* Hours Block */}
                <div className="flex flex-col items-center bg-[#FAF7F2] dark:bg-gray-800/80 border border-[#EBE4D8] dark:border-gray-700 rounded-2xl px-3 sm:px-4 py-2 min-w-[58px] sm:min-w-[72px] shadow-2xs">
                  <span className="text-2xl sm:text-4xl font-black text-[#1F2937] dark:text-white tabular-nums leading-none">
                    {pad2(displayHours)}
                  </span>
                  <span className="text-[9px] font-bold text-[#8A92A6] uppercase tracking-wider mt-1.5">
                    Hours
                  </span>
                </div>

                <span className={`text-2xl sm:text-3xl font-bold text-[#FF7A00] ${clockedIn && !onBreak ? 'animate-pulse' : 'opacity-40'}`}>:</span>

                {/* Minutes Block */}
                <div className="flex flex-col items-center bg-[#FAF7F2] dark:bg-gray-800/80 border border-[#EBE4D8] dark:border-gray-700 rounded-2xl px-3 sm:px-4 py-2 min-w-[58px] sm:min-w-[72px] shadow-2xs">
                  <span className="text-2xl sm:text-4xl font-black text-[#1F2937] dark:text-white tabular-nums leading-none">
                    {pad2(displayMinutes)}
                  </span>
                  <span className="text-[9px] font-bold text-[#8A92A6] uppercase tracking-wider mt-1.5">
                    Minutes
                  </span>
                </div>

                <span className={`text-2xl sm:text-3xl font-bold text-[#FF7A00] ${clockedIn && !onBreak ? 'animate-pulse' : 'opacity-40'}`}>:</span>

                {/* Seconds Block */}
                <div className="flex flex-col items-center bg-[#FFF5EB] dark:bg-[#FF7A00]/10 border border-[#FFD8B3] dark:border-[#FF7A00]/30 rounded-2xl px-3 sm:px-4 py-2 min-w-[58px] sm:min-w-[72px] shadow-2xs">
                  <span className="text-2xl sm:text-4xl font-black text-[#FF7A00] tabular-nums leading-none">
                    {pad2(displaySecs)}
                  </span>
                  <span className="text-[9px] font-bold text-[#FF7A00] uppercase tracking-wider mt-1.5">
                    Seconds
                  </span>
                </div>
              </div>

              {/* Shift Progress Bar */}
              <div className="w-full mt-3.5">
                <div className="flex justify-between items-center text-[11px] text-[#8A92A6] font-medium mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span>Shift Goal (480 min)</span>
                    <span className="text-[10px] text-[#64748B]">
                      {shiftProgressPercent >= 100
                        ? '🎉 8-Hour Goal Achieved!'
                        : `${remainingHours}h ${pad2(remainingMinsOnly)}m remaining`}
                    </span>
                  </span>
                  <span className="font-extrabold text-[#FF7A00]">{shiftProgressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#F1ECE4] dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-[#FF7A00] to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(3, shiftProgressPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 w-full">
              <button
                disabled={syncLoading}
                onClick={handleToggleClock}
                className={`flex-1 min-w-[160px] py-3.5 px-6 rounded-full font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 ${
                  clockedIn
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/20'
                    : 'bg-gradient-to-r from-[#FF981A] via-[#FF7A00] to-[#E66E00] hover:from-[#E68715] hover:to-[#CC5F00] text-white shadow-orange-500/25'
                }`}
              >
                {syncLoading ? (
                  <span>Syncing with Cloud...</span>
                ) : clockedIn ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Clock Out (Finish Shift)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Clock In (Start Work Session)</span>
                  </>
                )}
              </button>

              {clockedIn && (
                <button
                  disabled={syncLoading}
                  onClick={handleToggleBreak}
                  className="px-5 py-3.5 rounded-full border border-[#EBE4D8] dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] text-[#1F2937] dark:text-gray-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-98 shadow-2xs"
                >
                  <Coffee className="w-4 h-4 text-[#FF7A00]" />
                  <span>{onBreak ? 'Resume Work' : 'Take Break'}</span>
                </button>
              )}
            </div>

            {/* Location Geofence & Device Sync Status */}
            <div className="flex flex-wrap items-center justify-between w-full text-xs text-[#8A92A6] pt-1 border-t border-[#F1ECE4]/60 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span className="font-medium text-[#1F2937] dark:text-gray-300">Office HQ</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[10px] font-bold">
                  GPS Geofence Verified (25m)
                </span>
              </div>
              <span className="text-[10px] text-[#94A3B8]">
                Cross-device active sync • Phone & Web aligned
              </span>
            </div>
          </div>
        </div>

        {/* Today's Plan (Cols 9-12) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-[#1F2937] dark:text-white">Today's Priority Tasks</h2>
              {tasks.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400 border border-[#DCFCE7] dark:border-emerald-800">
                  {completedCount} of {tasks.length} completed
                </span>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-[#8A92A6] text-xs">
                <CheckSquare className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="font-semibold text-[#64748B] mb-1">No tasks scheduled for today</p>
                <p className="text-[11px] mb-3">Create your first task to start organizing your workday.</p>
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF7A00] text-white font-semibold text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Task</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.slice(0, 4).map((task) => {
                  const isDone = task.status === 'COMPLETED' || task.status === 'DONE';
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#FAF7F2] dark:hover:bg-gray-800 transition-colors cursor-pointer group border border-transparent hover:border-[#EBE4D8] dark:hover:border-gray-700"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-[#10B981] text-white shadow-xs'
                            : 'border-2 border-[#CBD5E1] group-hover:border-[#94A3B8]'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-xs select-none transition-all flex-1 line-clamp-1 ${
                          isDone
                            ? 'line-through text-[#94A3B8]'
                            : 'text-[#334155] dark:text-gray-300 font-medium group-hover:text-[#1F2937]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F1ECE4] dark:border-gray-800 mt-4">
            <Link
              href="/tasks"
              className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center justify-between group"
            >
              <span>Manage all tasks</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Four KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Today's Time */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">Today's Productive Time</span>
            <span className="text-2xl font-black text-[#1F2937] dark:text-white block tracking-tight">
              {totalTodayHours}h {pad2(totalTodayMinutes)}m
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Clock className="w-3 h-3" />
              <span>{shiftProgressPercent}% of 8h goal</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF7A00] flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-800">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Weekly Hours */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">This Week's Time</span>
            <span className="text-2xl font-black text-[#1F2937] dark:text-white block tracking-tight">
              {stats.hoursThisWeek}
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <span>Standard 40h</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Projects */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">Active Projects</span>
            <span className="text-2xl font-black text-[#1F2937] dark:text-white block tracking-tight">
              {stats.activeProjects} Sprints
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-semibold">
              <span>{projects.length} Total</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800">
            <FolderGit2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Tasks in Progress */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">Pending Tasks</span>
            <span className="text-2xl font-black text-[#1F2937] dark:text-white block tracking-tight">
              {stats.openTasks} Open
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span>{completedCount} Completed</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. AI Workplace Copilot Widget */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 text-white relative overflow-hidden shadow-lg border border-slate-700/60">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-[#FF7A00]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF7A00]/20 border border-[#FF7A00]/40 text-[#FF7A00] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Copilot
              </span>
              <span className="text-xs text-slate-400">• Intelligent Workforce Orchestration</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              What can WorkHub assist you with today?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Auto-generate timesheet narratives, draft leave requests, or summarize team sprint deliverables in seconds.
            </p>
          </div>

          <form onSubmit={handleAskCopilot} className="w-full md:w-auto flex-1 max-w-md">
            <div className="relative flex items-center">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Copilot (e.g., summarize my week or request leave)..."
                className="w-full pl-4 pr-12 py-3 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] transition-all backdrop-blur-xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 p-2 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={() => openAssistantWithPrompt('Review my weekly timesheets and attendance')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 transition-colors border border-white/10"
              >
                🕒 Weekly review
              </button>
              <button
                type="button"
                onClick={() => openAssistantWithPrompt('Draft a 2-day paid leave request for next week')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 transition-colors border border-white/10"
              >
                🌴 Draft leave
              </button>
              <button
                type="button"
                onClick={() => openAssistantWithPrompt('Show project milestones and sprint status')}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 transition-colors border border-white/10"
              >
                📊 Sprints status
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 5. Active Projects & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Card */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-[#1F2937] dark:text-white">Active Projects & Sprints</h3>
                <p className="text-xs text-[#8A92A6]">Team sprint track and delivery statuses</p>
              </div>
              <Link
                href="/projects"
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 3).map((proj) => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="block p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/60 hover:bg-[#F5EFE6] dark:hover:bg-gray-800 transition-all border border-[#EBE4D8] dark:border-gray-700/80"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#1F2937] dark:text-white">{proj.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {proj.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-gray-400 line-clamp-1 mb-2">
                    {proj.description || 'Sprint operational deliverable'}
                  </p>
                  <div className="w-full h-1.5 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF7A00] rounded-full" style={{ width: '65%' }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Team Overview */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-[#1F2937] dark:text-white mb-1">Quick Operational Actions</h3>
            <p className="text-xs text-[#8A92A6] mb-4">Frequently used workforce shortcuts</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link
                href="/timesheets"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/60 hover:bg-orange-50 border border-[#EBE4D8] dark:border-gray-700 flex flex-col justify-between transition-all group"
              >
                <FileText className="w-5 h-5 text-[#FF7A00] mb-2" />
                <span className="text-xs font-bold text-[#1F2937] dark:text-white group-hover:text-[#FF7A00] transition-colors">
                  Submit Timesheet
                </span>
                <span className="text-[10px] text-[#8A92A6]">Log daily hours</span>
              </Link>

              <Link
                href="/leave"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/60 hover:bg-emerald-50 border border-[#EBE4D8] dark:border-gray-700 flex flex-col justify-between transition-all group"
              >
                <Calendar className="w-5 h-5 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-[#1F2937] dark:text-white group-hover:text-emerald-600 transition-colors">
                  Request Leave
                </span>
                <span className="text-[10px] text-[#8A92A6]">Paid & Casual time off</span>
              </Link>

              <Link
                href="/attendance"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/60 hover:bg-blue-50 border border-[#EBE4D8] dark:border-gray-700 flex flex-col justify-between transition-all group"
              >
                <Clock className="w-5 h-5 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-[#1F2937] dark:text-white group-hover:text-blue-600 transition-colors">
                  Attendance Logs
                </span>
                <span className="text-[10px] text-[#8A92A6]">History & Geofence</span>
              </Link>

              <Link
                href="/download"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/60 hover:bg-purple-50 border border-[#EBE4D8] dark:border-gray-700 flex flex-col justify-between transition-all group"
              >
                <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
                <span className="text-xs font-bold text-[#1F2937] dark:text-white group-hover:text-purple-600 transition-colors">
                  Mobile & PWA App
                </span>
                <span className="text-[10px] text-[#8A92A6]">Download APK / Install</span>
              </Link>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-white dark:from-gray-800 dark:to-gray-900 border border-[#FFE2C8] dark:border-gray-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[#1F2937] dark:text-gray-200">
                WorkHub Network Operating System v1.0
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#FF7A00]">Online</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <WorkAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        initialPrompt={modalInitialPrompt}
      />
    </div>
  );
}
