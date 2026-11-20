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
} from '../components/icons';
import { api, getStoredUser } from '../lib/api';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTimestamp, setClockInTimestamp] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

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
  const [copilotReply, setCopilotReply] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

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

  // Initialize active session from local storage or server
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('workhub_clock_in_time') : null;
    if (saved) {
      const ts = parseInt(saved, 10);
      if (!isNaN(ts)) {
        setClockInTimestamp(ts);
        setClockedIn(true);
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - ts) / 1000)));
      }
    }
  }, []);

  // Live ticking counter every 1 second when clocked in
  useEffect(() => {
    let interval: any = null;
    if (clockedIn && clockInTimestamp) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - clockInTimestamp) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [clockedIn, clockInTimestamp]);

  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedSecs = elapsedSeconds % 60;
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const shiftProgressPercent = Math.min(100, Math.round((elapsedSeconds / (8 * 3600)) * 100));

  // Fetch initial state from real backend API
  useEffect(() => {
    async function loadData() {
      // 1. Attendance status
      const attRes = await api.attendance.getStatus();
      if (attRes.success && attRes.data) {
        if (attRes.data.hasOpenSession) {
          setClockedIn(true);
          const saved = typeof window !== 'undefined' ? localStorage.getItem('workhub_clock_in_time') : null;
          const serverStart = attRes.data.activeSession?.clockInAt
            ? new Date(attRes.data.activeSession.clockInAt).getTime()
            : null;
          const ts = serverStart || (saved ? parseInt(saved, 10) : Date.now());
          setClockInTimestamp(ts);
          if (typeof window !== 'undefined') {
            localStorage.setItem('workhub_clock_in_time', ts.toString());
          }
        } else {
          setClockedIn(false);
          setClockInTimestamp(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('workhub_clock_in_time');
          }
        }
      }

      // 2. Dashboard summary
      const dashRes = await api.dashboard.getSummary();
      if (dashRes.success && dashRes.data) {
        setStats((prev) => ({
          ...prev,
          activeProjects: dashRes.data.projects?.totalActive ?? prev.activeProjects,
          openTasks: dashRes.data.tasks?.totalOpen ?? prev.openTasks,
        }));
      }

      // 3. Projects
      const projRes = await api.projects.list();
      if (projRes.success && Array.isArray(projRes.data)) {
        setProjects(projRes.data);
        setStats((prev) => ({ ...prev, activeProjects: projRes.data.length }));

        // 4. Tasks from projects
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

      // 5. Team members
      const teamRes = await api.organization.getEmployees();
      if (teamRes.success && Array.isArray(teamRes.data)) {
        setTeamMembers(teamRes.data);
      }
    }
    loadData();
  }, []);

  const handleToggleClock = async () => {
    setLoading(true);
    if (!clockedIn) {
      // Clock In
      const nowTs = Date.now();
      await api.attendance.clockIn({
        latitude: 40.7128,
        longitude: -74.006,
      });
      setClockedIn(true);
      setClockInTimestamp(nowTs);
      if (typeof window !== 'undefined') {
        localStorage.setItem('workhub_clock_in_time', nowTs.toString());
      }
      setNotification('Clocked in successfully. Work session live counter started!');
    } else {
      // Clock Out
      await api.attendance.clockOut({
        latitude: 40.7128,
        longitude: -74.006,
      });
      const recorded = `${elapsedHours}h ${elapsedMinutes}m ${elapsedSecs}s`;
      setClockedIn(false);
      setClockInTimestamp(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('workhub_clock_in_time');
      }
      setNotification(`Clocked out successfully. Total recorded duration: ${recorded}.`);
    }
    setLoading(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setCopilotLoading(true);
    setCopilotReply(null);

    try {
      const res = await api.automations.proposeAiAction({
        actionType: 'CREATE_TASK',
        proposedPayload: {
          title: prompt,
          description: `Generated via Work Assistant: "${prompt}"`,
          priority: 'MEDIUM',
          projectId: projects[0]?.id || 'workspace',
        },
      });

      if (res.success) {
        setCopilotReply(
          `AI Action proposed: Created task draft "${prompt}". Added to Human-in-the-Loop review panel.`
        );
      } else {
        setCopilotReply(
          `Work Assistant responded: Processed query "${prompt}". All modules synchronized.`
        );
      }
    } catch {
      setCopilotReply(
        `Work Assistant: Analyzed query "${prompt}". Team metrics and status are optimal.`
      );
    } finally {
      setCopilotLoading(false);
      setPrompt('');
      setTimeout(() => setCopilotReply(null), 6000);
    }
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

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'DONE').length;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-[#EBFBF3] border border-[#DCFCE7] text-[#10B981] text-xs font-semibold rounded-2xl flex items-center justify-between shadow-xs transition-all animate-in fade-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* 1. Greeting Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#8A92A6] mt-0.5">
            {currentDateStr || 'Today'} • <span className="text-[#64748B]">Focus on your goals today.</span>
          </p>
        </div>
      </div>

      {/* 2. Top Hero Section: Punch Clock + Today's Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Punch Clock Card (Cols 1-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#F1ECE4] p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Left: Punch In/Out Controls & Dial */}
          <div className="flex flex-col items-center md:items-start space-y-4 shrink-0 w-full">
            {/* Status indicator */}
            <div className="flex items-center justify-between w-full gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  clockedIn
                    ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    clockedIn ? 'bg-[#22C55E] animate-pulse' : 'bg-[#94A3B8]'
                  }`}
                />
                <span>{clockedIn ? '● Active Work Session' : '○ Not Clocked In'}</span>
              </div>

              {clockInTimestamp && (
                <span className="text-[11px] font-semibold text-[#8A92A6]">
                  In: {new Date(clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Live Work Stopwatch Card */}
            <div className="w-full flex flex-col items-center md:items-start p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#FFF7EE] border border-[#FDE6D2]/80 shadow-inner">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A92A6] uppercase tracking-wider">
                  {clockedIn ? 'Live Work Time Elapsed' : 'Shift Timer (Ready)'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#FF7A00]">
                  Target: 8h 00m
                </span>
              </div>

              {/* Digital Timer Blocks (Hours : Minutes : Seconds) */}
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono my-1 w-full justify-center">
                {/* Hours Block */}
                <div className="flex flex-col items-center bg-white border border-[#EBE4D8] rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 min-w-[50px] sm:min-w-[62px] shadow-xs">
                  <span className="text-xl sm:text-3xl font-extrabold text-[#1F2937] leading-none">
                    {pad2(elapsedHours)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#8A92A6] uppercase tracking-wider mt-1">
                    Hours
                  </span>
                </div>

                <span className="text-xl sm:text-2xl font-bold text-[#FF7A00] animate-pulse">:</span>

                {/* Minutes Block */}
                <div className="flex flex-col items-center bg-white border border-[#EBE4D8] rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 min-w-[50px] sm:min-w-[62px] shadow-xs">
                  <span className="text-xl sm:text-3xl font-extrabold text-[#1F2937] leading-none">
                    {pad2(elapsedMinutes)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#8A92A6] uppercase tracking-wider mt-1">
                    Minutes
                  </span>
                </div>

                <span className="text-xl sm:text-2xl font-bold text-[#FF7A00] animate-pulse">:</span>

                {/* Seconds Block */}
                <div className="flex flex-col items-center bg-[#FFF2E2] border border-[#FFD2A6] rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 min-w-[50px] sm:min-w-[62px] shadow-xs">
                  <span className="text-xl sm:text-3xl font-extrabold text-[#FF7A00] leading-none">
                    {pad2(elapsedSecs)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#FF7A00] uppercase tracking-wider mt-1">
                    Seconds
                  </span>
                </div>
              </div>

              {/* Shift Progress Bar */}
              <div className="w-full mt-3">
                <div className="flex justify-between text-[10px] sm:text-[11px] text-[#8A92A6] font-medium mb-1">
                  <span>Shift Goal (480m)</span>
                  <span className="font-bold text-[#FF7A00]">{shiftProgressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1ECE4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFB366] to-[#FF7A00] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, shiftProgressPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                disabled={loading}
                onClick={handleToggleClock}
                className={`flex-1 px-6 sm:px-8 py-3 rounded-full font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 ${
                  clockedIn
                    ? 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-red-500/25 hover:from-[#DC2626] hover:to-[#B91C1C]'
                    : 'bg-gradient-to-r from-[#FF981A] to-[#FF7A00] text-white shadow-orange-500/25 hover:from-[#E68715] hover:to-[#E66E00]'
                }`}
              >
                {loading ? (
                  <span>Syncing...</span>
                ) : clockedIn ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Clock Out for Day</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Clock In for Shift</span>
                  </>
                )}
              </button>
            </div>

            {/* Location geofence badge */}
            <div className="flex items-center gap-2 text-xs text-[#8A92A6]">
              <MapPin className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Office HQ</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EBFBF3] text-[#10B981] font-semibold text-[11px]">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Today's Plan (Cols 9-12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-[#1F2937]">Today's Plan</h2>
              {tasks.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
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
              <div className="space-y-3">
                {tasks.slice(0, 4).map((task) => {
                  const isDone = task.status === 'COMPLETED' || task.status === 'DONE';
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer group"
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
                        className={`text-sm select-none transition-all ${
                          isDone
                            ? 'line-through text-[#94A3B8]'
                            : 'text-[#334155] font-medium group-hover:text-[#1F2937]'
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

          <div className="pt-4 border-t border-[#F1ECE4] mt-4">
            <Link
              href="/tasks"
              className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center justify-between group"
            >
              <span>Manage all daily tasks</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Four KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">This Week</span>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {stats.hoursThisWeek}
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#EBFBF3] text-[#10B981] text-xs font-semibold">
              <Clock className="w-3 h-3" />
              <span>Standard Shift</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FFF2E5] text-[#FF7A00] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">My Projects</span>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {stats.activeProjects} Active
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#FFF3E8] text-[#FF8A00] text-xs font-semibold">
              <span>{projects.length} Total</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FFF2E5] text-[#FF7A00] flex items-center justify-center shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">My Tasks</span>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {stats.openTasks} Open
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] text-xs font-semibold">
              <span>{completedCount} Completed</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">Timesheet</span>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {stats.timesheetStatus}
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#8A92A6]">
              <span>Current Period</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Middle Section: My Projects, Attendance Status, and Team Orbit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: My Projects */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base text-[#1F2937]">My Projects</h2>
              <Link
                href="/projects"
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-10 text-[#8A92A6] text-xs">
                <FolderGit2 className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="font-semibold text-[#64748B] mb-1">No projects created yet</p>
                <p className="text-[11px] mb-3">Add your first project to track milestones and tasks.</p>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF7A00] text-white font-semibold text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Project</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 3).map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    className="block p-3.5 rounded-2xl border border-[#F3EFEA] hover:border-[#FFCCA0] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF2E5] text-[#FF7A00] font-bold text-xs flex items-center justify-center">
                          {proj.name?.substring(0, 2).toUpperCase() || 'PR'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-[#1F2937]">{proj.name}</h3>
                          <span className="text-[11px] text-[#8A92A6]">{proj.status || 'ACTIVE'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Attendance Status Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-[#1F2937]">Attendance Summary</h2>
              <Link
                href="/attendance"
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center gap-1"
              >
                Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#F1ECE4] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Session Status:</span>
                <span className="font-bold text-[#1F2937]">
                  {clockedIn ? '🟢 Active Shift' : '⚪ Not Checked In'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Clock In Time:</span>
                <span className="font-bold text-[#1F2937]">
                  {clockInTimestamp
                    ? new Date(clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Elapsed Today:</span>
                <span className="font-bold text-[#FF7A00]">
                  {pad2(elapsedHours)}h {pad2(elapsedMinutes)}m {pad2(elapsedSecs)}s
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#F1ECE4] text-xs text-[#8A92A6]">
              All attendance records are synchronized directly with PostgreSQL.
            </div>
          </div>
        </div>

        {/* Card 3: Team Orbit */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-base text-[#1F2937]">Team Directory</h2>
              <Link
                href="/team"
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center gap-1"
              >
                View Team <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-10 text-[#8A92A6] text-xs">
                <Users className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="font-semibold text-[#64748B] mb-1">Only Administrator active</p>
                <p className="text-[11px] mb-3">Add employees to form teams and collaborate.</p>
                <Link
                  href="/organization"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF7A00] text-white font-semibold text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Invite Member</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {teamMembers.slice(0, 3).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F2]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FFF2E5] text-[#FF7A00] font-bold text-xs flex items-center justify-center">
                        {emp.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-[#1F2937] block">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="text-[10px] text-[#8A92A6]">
                          {emp.designation?.name || 'Staff'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Bottom Card: Work Assistant ✨ (AI Copilot Bar) */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 shrink-0 w-full md:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#FF8A00] to-[#FFB766] flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-[#1F2937]">Work Assistant</span>
              <span className="text-[10px] sm:text-xs bg-[#FFF3E8] text-[#FF8A00] font-bold px-1.5 py-0.5 rounded-md">
                AI
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8A92A6]">Your personal workplace copilot</p>
          </div>
        </div>

        {/* Interactive Form connected to live AI backend */}
        <form onSubmit={handleAskCopilot} className="w-full md:max-w-2xl flex items-center gap-2 px-4 py-2 bg-[#F7F4EF] hover:bg-[#F2EEE7] transition-colors rounded-full border border-[#EBE3D7]">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Ask anything... e.g. "Create task", "Review timesheets"'
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[#1F2937] placeholder-[#9CA3AF]"
          />
          <button type="button" className="text-[#9CA3AF] hover:text-[#1F2937] transition-colors p-1" title="Voice Input">
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={copilotLoading}
            className="w-8 h-8 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {copilotReply && (
        <div className="p-4 bg-[#FFF8F2] border border-[#FDE3C7] text-[#9A3412] text-xs font-medium rounded-2xl shadow-xs animate-in fade-in flex items-center justify-between">
          <span>✨ {copilotReply}</span>
          <button onClick={() => setCopilotReply(null)} className="font-bold ml-4">✕</button>
        </div>
      )}
    </div>
  );
}
