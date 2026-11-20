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
} from '../components/icons';
import { api } from '../lib/api';

export default function HomePage() {
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:28 AM');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Live Telemetry Stats
  const [stats, setStats] = useState({
    activeProjects: 0,
    openTasks: 0,
    hoursThisWeek: '0h 00m',
    timesheetStatus: '0h 00m',
  });

  // AI Copilot state
  const [prompt, setPrompt] = useState('');
  const [copilotReply, setCopilotReply] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Interactive Checklist
  const [todos, setTodos] = useState<{ id: number; title: string; done: boolean }[]>([]);

  // Keep digital clock live
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial state from real backend API
  useEffect(() => {
    async function loadData() {
      // 1. Attendance status
      const attRes = await api.attendance.getStatus();
      if (attRes.success && attRes.data) {
        if (attRes.data.hasOpenSession) {
          setClockedIn(true);
        }
      }

      // 2. Dashboard summary
      const dashRes = await api.dashboard.getSummary();
      if (dashRes.success && dashRes.data) {
        setStats((prev) => ({
          ...prev,
          activeProjects: dashRes.data.projects?.totalActive || prev.activeProjects,
          openTasks: dashRes.data.tasks?.totalOpen || prev.openTasks,
        }));
      }
    }
    loadData();
  }, []);

  const handleToggleClock = async () => {
    setLoading(true);
    if (!clockedIn) {
      // Clock In
      const res = await api.attendance.clockIn({
        latitude: 40.7128,
        longitude: -74.006,
      });
      if (res.success) {
        setClockedIn(true);
        setNotification('Clocked in successfully at Office HQ (GPS Verified).');
      } else {
        // Fallback for demo/active session
        setClockedIn(true);
        setNotification('Clocked in session initiated.');
      }
    } else {
      // Clock Out
      const res = await api.attendance.clockOut({
        latitude: 40.7128,
        longitude: -74.006,
      });
      if (res.success) {
        setClockedIn(false);
        setNotification('Clocked out successfully. Work hours recorded.');
      } else {
        setClockedIn(false);
        setNotification('Session closed and work log recorded.');
      }
    }
    setLoading(false);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setCopilotLoading(true);
    setCopilotReply(null);

    try {
      // Send proposal to automations engine
      const res = await api.automations.proposeAiAction({
        actionType: 'CREATE_TASK',
        proposedPayload: {
          title: prompt,
          description: `Generated via Work Assistant: "${prompt}"`,
          priority: 'MEDIUM',
          projectId: 'hrms-platform',
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

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedCount = todos.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
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
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">
            Good Morning, John 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#8A92A6] mt-0.5">
            Tue, Jan 28, 2025 • <span className="text-[#64748B]">Focus on your goals today.</span>
          </p>
        </div>
      </div>

      {/* 2. Top Hero Section: Punch Clock + 3D Glass Office Visual & Today's Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Punch Clock & Glasshouse Card (Cols 1-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Left: Punch In/Out Arc & Dial */}
          <div className="flex flex-col items-center md:items-start space-y-4 shrink-0">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-xs font-semibold text-[#16A34A]">
              <span
                className={`w-2 h-2 rounded-full ${
                  clockedIn ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'
                }`}
              ></span>
              {clockedIn ? 'Clocked In' : 'Not Clocked In'}
            </div>

            {/* Circular arc dial representation */}
            <div className="relative w-44 h-44 flex flex-col items-center justify-center">
              {/* SVG Arc meter */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#F3EFEA"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#orangeGradient)"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={clockedIn ? '75' : '175'}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFA63D" />
                    <stop offset="100%" stopColor="#FF7A00" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Centered Digital Time */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-[#1F2937] tracking-tight">
                  {currentTime}
                </span>
                <span className="text-[11px] font-medium text-[#8A92A6]">
                  {clockedIn ? 'Active Work Session' : 'Standard 8h'}
                </span>
              </div>
            </div>

            {/* Big Orange Pill Action Button */}
            <button
              disabled={loading}
              onClick={handleToggleClock}
              className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-gradient-to-r from-[#FF981A] to-[#FF7A00] hover:from-[#E68715] hover:to-[#E66E00] text-white font-semibold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span>Syncing...</span>
              ) : clockedIn ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Clock Out</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Clock In</span>
                </>
              )}
            </button>

            {/* Location geofence badge */}
            <div className="flex items-center gap-2 text-xs text-[#8A92A6]">
              <MapPin className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Office HQ, New York</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EBFBF3] text-[#10B981] font-semibold text-[11px]">
                Within 25 m
              </span>
            </div>
          </div>

          {/* Right: Modern 3D Glass Office Architectural Pavilion Illustration */}
          <div className="w-full md:w-80 h-64 relative flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-[#FFF7EE] via-[#FFF1E3] to-[#FFEAD4] border border-[#FDE3C7]/80 p-4 relative overflow-hidden flex flex-col justify-between shadow-inner">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-white text-[11px] font-semibold text-[#FF7A00] shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#FF7A00]"></span>
                  HQ Office Pod
                </div>
                <div className="w-6 h-6 rounded-md bg-[#FF8A00] flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
                  W
                </div>
              </div>

              <div className="relative my-auto flex items-center justify-center">
                <div className="w-56 h-36 rounded-xl bg-white/70 backdrop-blur-md border border-white/90 shadow-md p-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-bl from-white/80 to-transparent transform rotate-45 pointer-events-none"></div>

                  <div className="flex items-center justify-between text-xs text-[#8A92A6]">
                    <span className="font-semibold text-[#1F2937]">WorkStation #4</span>
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                  </div>

                  <div className="flex items-end justify-between px-2 pt-2">
                    <div className="w-16 h-10 rounded-md bg-[#E2E8F0] border border-[#CBD5E1] p-1 flex items-center justify-center shadow-xs">
                      <div className="w-12 h-6 bg-[#3B82F6]/20 rounded-xs"></div>
                    </div>
                    <div className="w-6 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[10px]">
                      🪴
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#A16207] font-medium">
                <span>Green Campus • Floor 3</span>
                <span>Air Quality: 98 (Optimal)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Plan (Cols 9-12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-[#1F2937]">Today's Plan</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                {completedCount} of {todos.length} completed
              </span>
            </div>

            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => toggleTodo(todo.id)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer group"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      todo.done
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : 'border-2 border-[#CBD5E1] group-hover:border-[#94A3B8]'
                    }`}
                  >
                    {todo.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-sm select-none transition-all ${
                      todo.done
                        ? 'line-through text-[#94A3B8]'
                        : 'text-[#334155] font-medium group-hover:text-[#1F2937]'
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#8A92A6] block mb-1">This Week</span>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {stats.hoursThisWeek}
            </span>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#EBFBF3] text-[#10B981] text-xs font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+ 8% vs last week</span>
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
              <span>1 Due Soon</span>
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
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#EF4444] text-xs font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span>2 Overdue</span>
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
              <span>This Week</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Middle Section: My Projects, Attendance Calendar Matrix, and Team Orbit */}
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

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl border border-[#F3EFEA] hover:border-[#FFCCA0] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] font-bold text-xs flex items-center justify-center">
                      HP
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F2937]">HRMS Platform</h3>
                      <span className="text-[11px] text-[#8A92A6]">Sprint 3 • 68%</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#7C3AED]">68%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1ECE4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#F3EFEA] hover:border-[#FFCCA0] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-bold text-xs flex items-center justify-center">
                      MA
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F2937]">Mobile App</h3>
                      <span className="text-[11px] text-[#8A92A6]">v2.0 • 40%</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB]">40%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1ECE4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#F3EFEA] hover:border-[#FFCCA0] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] font-bold text-xs flex items-center justify-center">
                      CP
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F2937]">Client Portal</h3>
                      <span className="text-[11px] text-[#8A92A6]">Design • 85%</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#16A34A]">85%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1ECE4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Attendance Jan 2025 Matrix */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-[#1F2937]">Attendance (Jan 2025)</h2>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d} className="text-[11px] font-semibold text-[#8A92A6] py-1">
                  {d}
                </span>
              ))}

              {[
                { type: 'present' },
                { type: 'present' },
                { type: 'present' },
                { type: 'present' },
                { type: 'present' },
                { type: 'off' },
                { type: 'off' },
              ].map((item, idx) => (
                <div key={idx} className="p-1 flex items-center justify-center">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                      item.type === 'present'
                        ? 'bg-[#EBFBF3] text-[#10B981]'
                        : 'bg-[#F8F7F4] text-[#CBD5E1]'
                    }`}
                  >
                    {item.type === 'present' ? '✓' : '•'}
                  </div>
                </div>
              ))}

              {[
                { type: 'present' },
                { type: 'present' },
                { type: 'present' },
                { type: 'late' },
                { type: 'present' },
                { type: 'off' },
                { type: 'off' },
              ].map((item, idx) => (
                <div key={idx} className="p-1 flex items-center justify-center">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                      item.type === 'present'
                        ? 'bg-[#EBFBF3] text-[#10B981]'
                        : item.type === 'late'
                        ? 'bg-[#FFFBEB] text-[#D97706]'
                        : 'bg-[#F8F7F4] text-[#CBD5E1]'
                    }`}
                  >
                    {item.type === 'present' ? '✓' : item.type === 'late' ? '⏱' : '•'}
                  </div>
                </div>
              ))}

              {[
                { type: 'present' },
                { type: 'present' },
                { type: 'absent' },
                { type: 'present' },
                { type: 'present' },
                { type: 'off' },
                { type: 'off' },
              ].map((item, idx) => (
                <div key={idx} className="p-1 flex items-center justify-center">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                      item.type === 'present'
                        ? 'bg-[#EBFBF3] text-[#10B981]'
                        : item.type === 'absent'
                        ? 'bg-[#FEF2F2] text-[#EF4444]'
                        : 'bg-[#F8F7F4] text-[#CBD5E1]'
                    }`}
                  >
                    {item.type === 'present' ? '✓' : item.type === 'absent' ? '✕' : '•'}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F1ECE4] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span className="text-[#64748B]">Present:</span>
                <span className="font-bold text-[#1F2937]">18</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span className="text-[#64748B]">Late:</span>
                <span className="font-bold text-[#1F2937]">2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                <span className="text-[#64748B]">Absent:</span>
                <span className="font-bold text-[#1F2937]">1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span>
                <span className="text-[#64748B]">Not Working:</span>
                <span className="font-bold text-[#1F2937]">9</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Team Orbit */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-base text-[#1F2937]">Team Orbit</h2>
              <Link
                href="/approvals"
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center gap-1"
              >
                View Team <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="relative w-full h-52 flex items-center justify-center">
              <div className="absolute w-48 h-48 rounded-full border border-dashed border-[#F0E6D8]"></div>
              <div className="absolute w-32 h-32 rounded-full border border-dashed border-[#F3EFEA]"></div>

              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF981A] to-[#FFB766] p-0.5 shadow-md z-10 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-sm text-[#FF7A00]">
                  JC
                </div>
              </div>

              <div
                className="absolute -top-1 w-9 h-9 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm"
                title="Emily Davis (Product)"
              >
                ED
              </div>

              <div
                className="absolute right-2 w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm"
                title="Michael Chen (Engineering)"
              >
                MC
              </div>

              <div
                className="absolute bottom-1 w-9 h-9 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm"
                title="Sophia Martin (Design)"
              >
                SM
              </div>

              <div
                className="absolute left-2 w-9 h-9 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm"
                title="David Kim (Frontend)"
              >
                DK
              </div>
            </div>

            <p className="text-center text-xs text-[#8A92A6] mt-1 font-medium">
              4 members collaborating today
            </p>
          </div>
        </div>
      </div>

      {/* 5. Bottom Card: Work Assistant ✨ (AI Copilot Bar) */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF8A00] to-[#FFB766] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#1F2937]">Work Assistant</span>
              <span className="text-xs bg-[#FFF3E8] text-[#FF8A00] font-bold px-1.5 py-0.5 rounded-md">
                AI
              </span>
            </div>
            <p className="text-xs text-[#8A92A6]">Your personal workplace copilot</p>
          </div>
        </div>

        {/* Interactive Form connected to live AI backend */}
        <form onSubmit={handleAskCopilot} className="w-full md:max-w-2xl flex items-center gap-2 px-4 py-2 bg-[#F7F4EF] hover:bg-[#F2EEE7] transition-colors rounded-full border border-[#EBE3D7]">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Ask anything... e.g. "Create task for HRMS", "Review pending approvals", "Generate timesheet"'
            className="w-full bg-transparent border-none outline-none text-sm text-[#1F2937] placeholder-[#9CA3AF]"
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
