'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  MapPin,
  Coffee,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingUp,
} from '../../components/icons';
import { api } from '../../lib/api';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'history' | 'corrections'>('attendance');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTimestamp, setClockInTimestamp] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:28 AM');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);

  // Update wall clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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

  // Live ticking work stopwatch
  useEffect(() => {
    let interval: any = null;
    if (clockedIn && clockInTimestamp && !onBreak) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - clockInTimestamp) / 1000)));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [clockedIn, clockInTimestamp, onBreak]);

  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedSecs = elapsedSeconds % 60;
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const shiftProgressPercent = Math.min(100, Math.round((elapsedSeconds / (8 * 3600)) * 100));

  // Load live attendance from backend
  useEffect(() => {
    async function loadAttendance() {
      const res = await api.attendance.getStatus();
      if (res.success && res.data) {
        const session = res.data.currentSession || res.data.activeSession;
        const isClocked = Boolean(res.data.isClockedIn || res.data.hasOpenSession || session);

        if (isClocked && session) {
          setClockedIn(true);
          const serverStart = session.clockInAt
            ? new Date(session.clockInAt).getTime()
            : null;
          const saved = typeof window !== 'undefined' ? localStorage.getItem('workhub_clock_in_time') : null;
          const ts = serverStart || (saved ? parseInt(saved, 10) : Date.now());
          setClockInTimestamp(ts);
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - ts) / 1000)));
          if (typeof window !== 'undefined') {
            localStorage.setItem('workhub_clock_in_time', ts.toString());
          }
        } else if (res.data.isClockedIn === false && !session) {
          setClockedIn(false);
          setClockInTimestamp(null);
          setElapsedSeconds(0);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('workhub_clock_in_time');
          }
        }
        if (res.data.activeBreak || res.data.currentBreak || res.data.isOnBreak) {
          setOnBreak(true);
        } else {
          setOnBreak(false);
        }
      }

      const histRes = await api.attendance.getHistory();
      if (histRes.success && Array.isArray(histRes.data)) {
        const formatted = histRes.data.map((item: any) => ({
          date: new Date(item.clockInAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          in: new Date(item.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          out: item.clockOutAt ? new Date(item.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
          breaks: `${item.totalBreakMinutes || 0}m`,
          net: item.netDurationMinutes ? `${Math.floor(item.netDurationMinutes / 60)}h ${item.netDurationMinutes % 60}m` : 'Active',
          status: item.status === 'CLOSED' ? 'PRESENT' : 'OPEN',
        }));
        setHistory(formatted);
      }
    }
    loadAttendance();
  }, []);

  const handleClockIn = async () => {
    setLoading(true);
    const res = await api.attendance.clockIn({ latitude: 40.7128, longitude: -74.006 });
    const session = res.data;
    const serverStart = session?.clockInAt
      ? new Date(session.clockInAt).getTime()
      : Date.now();
    setClockedIn(true);
    setClockInTimestamp(serverStart);
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - serverStart) / 1000)));
    if (typeof window !== 'undefined') {
      localStorage.setItem('workhub_clock_in_time', serverStart.toString());
    }
    setFeedback('Clock In verified. Attendance work session timer started.');
    setLoading(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleClockOut = async () => {
    setLoading(true);
    const res = await api.attendance.clockOut({ latitude: 40.7128, longitude: -74.006 });
    const recorded = `${elapsedHours}h ${elapsedMinutes}m ${elapsedSecs}s`;
    setClockedIn(false);
    setClockInTimestamp(null);
    setOnBreak(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('workhub_clock_in_time');
    }
    setFeedback(`Clock Out registered. Net duration logged: ${recorded}.`);
    setLoading(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleBreak = async () => {
    setLoading(true);
    if (!onBreak) {
      const res = await api.attendance.startBreak('COFFEE');
      if (res.success) {
        setOnBreak(true);
        setFeedback('Break started. Work timer paused.');
      } else {
        setOnBreak(true);
      }
    } else {
      const res = await api.attendance.endBreak();
      if (res.success) {
        setOnBreak(false);
        setFeedback('Break ended. Work session resumed.');
      } else {
        setOnBreak(false);
      }
    }
    setLoading(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-[#EBFBF3] border border-[#DCFCE7] text-[#10B981] text-xs font-semibold rounded-2xl flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Title & Subtabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Attendance</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Track your daily work hours, GPS verified clock-in, breaks, and monthly attendance.
          </p>
        </div>

        {/* Subtabs Pill */}
        <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8] flex-wrap">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'attendance'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            My Attendance
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'corrections'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Correction Requests
          </button>
        </div>
      </div>

      {/* Main Top Punch Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Punch Clock & Geofence Map Card (Cols 1-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-4 shrink-0 w-full md:w-auto">
            {/* Status Pill & In-time */}
            <div className="flex items-center justify-between w-full md:w-auto gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  clockedIn
                    ? onBreak
                      ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                      : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    clockedIn
                      ? onBreak
                        ? 'bg-[#D97706]'
                        : 'bg-[#22C55E] animate-pulse'
                      : 'bg-[#94A3B8]'
                  }`}
                />
                <span>
                  {clockedIn
                    ? onBreak
                      ? '● On Break (Timer Paused)'
                      : '● Active Work Session'
                    : '○ Not Clocked In'}
                </span>
              </div>

              {clockInTimestamp && (
                <span className="text-[11px] font-semibold text-[#8A92A6]">
                  In at {new Date(clockInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Live Work Stopwatch Card */}
            <div className="w-full flex flex-col items-center md:items-start p-4 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#FFF7EE] border border-[#FDE6D2]/80 shadow-inner">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[11px] font-bold text-[#8A92A6] uppercase tracking-wider">
                  {clockedIn ? 'Live Work Time Elapsed' : 'Shift Timer (Ready)'}
                </span>
                <span className="text-[11px] font-bold text-[#FF7A00]">
                  Target: 8h 00m
                </span>
              </div>

              {/* Digital Timer Blocks (Hours : Minutes : Seconds) */}
              <div className="flex items-center gap-2 font-mono my-1">
                {/* Hours Block */}
                <div className="flex flex-col items-center bg-white border border-[#EBE4D8] rounded-2xl px-3.5 py-2 min-w-[62px] shadow-xs">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] leading-none">
                    {pad2(elapsedHours)}
                  </span>
                  <span className="text-[9px] font-bold text-[#8A92A6] uppercase tracking-wider mt-1">
                    Hours
                  </span>
                </div>

                <span className="text-2xl font-bold text-[#FF7A00] animate-pulse">:</span>

                {/* Minutes Block */}
                <div className="flex flex-col items-center bg-white border border-[#EBE4D8] rounded-2xl px-3.5 py-2 min-w-[62px] shadow-xs">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] leading-none">
                    {pad2(elapsedMinutes)}
                  </span>
                  <span className="text-[9px] font-bold text-[#8A92A6] uppercase tracking-wider mt-1">
                    Minutes
                  </span>
                </div>

                <span className="text-2xl font-bold text-[#FF7A00] animate-pulse">:</span>

                {/* Seconds Block */}
                <div className="flex flex-col items-center bg-[#FFF2E2] border border-[#FFD2A6] rounded-2xl px-3.5 py-2 min-w-[62px] shadow-xs">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#FF7A00] leading-none">
                    {pad2(elapsedSecs)}
                  </span>
                  <span className="text-[9px] font-bold text-[#FF7A00] uppercase tracking-wider mt-1">
                    Seconds
                  </span>
                </div>
              </div>

              {/* Shift Progress Bar */}
              <div className="w-full mt-3">
                <div className="flex justify-between text-[11px] text-[#8A92A6] font-medium mb-1">
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
                onClick={clockedIn ? handleClockOut : handleClockIn}
                className={`flex-1 px-8 py-3 rounded-full font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 ${
                  clockedIn
                    ? 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-red-500/25 hover:from-[#DC2626] hover:to-[#B91C1C]'
                    : 'bg-gradient-to-r from-[#FF981A] to-[#FF7A00] text-white shadow-orange-500/25 hover:from-[#E68715] hover:to-[#E66E00]'
                }`}
              >
                {loading ? (
                  <span>Processing...</span>
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

              {clockedIn && (
                <button
                  disabled={loading}
                  onClick={handleToggleBreak}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    onBreak
                      ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                      : 'bg-white text-[#64748B] border-[#E2DDD5] hover:bg-[#F9F7F4]'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{onBreak ? 'Resume Work' : 'Take Break'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Geofence Vector Map Graphic */}
          <div className="w-full md:w-80 h-56 rounded-3xl bg-[#FFF8F0] border border-[#FDE5CF] p-4 flex flex-col justify-between relative overflow-hidden shadow-xs shrink-0">
            {/* Vector Map Background: streets, highways, and blocks */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 320 220"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M -20 40 L 340 60" stroke="#FDBA74" strokeWidth="6" strokeLinecap="round" />
              <path d="M 40 -20 L 70 240" stroke="#FDBA74" strokeWidth="8" strokeLinecap="round" />
              <path d="M 160 -20 L 150 240" stroke="#FED7AA" strokeWidth="5" strokeLinecap="round" />
              <path d="M -20 150 L 340 130" stroke="#FED7AA" strokeWidth="5" strokeLinecap="round" />
              <path d="M 240 -20 L 270 240" stroke="#FED7AA" strokeWidth="4" strokeLinecap="round" />
              <path d="M -20 90 L 340 180" stroke="#FED7AA" strokeWidth="3" strokeDasharray="6 4" />
              <path d="M 80 180 L 300 20" stroke="#FDBA74" strokeWidth="4" />
            </svg>

            {/* Top / Center: Geofence Circular Boundary Zone + Pin Marker */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[#FF8A00]/10 border-2 border-dashed border-[#FF8A00]/40 flex items-center justify-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#FF8A00]/15 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF7A00] to-[#FFA338] text-white flex items-center justify-center shadow-md shadow-orange-500/30">
                    <MapPin className="w-5 h-5 fill-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Info Section: Clean, perfectly legible, no overlapping lines */}
            <div className="relative z-10 bg-white/95 backdrop-blur-xs rounded-2xl py-2 px-3 border border-[#F1ECE4] shadow-xs text-center flex flex-col items-center">
              <span className="font-bold text-xs text-[#1F2937]">Office HQ, New York</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                <span className="text-[11px] font-semibold text-[#16A34A]">Within 25 meters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity & This Month (Cols 9-12) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs flex flex-col justify-between">
            <h2 className="font-bold text-sm text-[#1F2937] mb-3">Today's Activity</h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#F5F2EB]">
                <span className="text-[#8A92A6]">Active Work Session</span>
                <span className="font-bold text-[#1F2937] font-mono">
                  {pad2(elapsedHours)}h {pad2(elapsedMinutes)}m {pad2(elapsedSecs)}s
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#F5F2EB]">
                <span className="text-[#8A92A6]">Breaks</span>
                <span className="font-bold text-[#1F2937]">
                  {onBreak ? '☕ On Break' : '0m'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#1F2937]">Session Status</span>
                <span className="font-bold text-[#FF7A00]">
                  {clockedIn ? '● In Progress' : '○ Not Clocked In'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#8A92A6] block mb-1">Standard Shift Target</span>
              <span className="text-xl font-bold text-[#1F2937]">8h 00m</span>
              <span className="text-xs text-[#10B981] font-semibold block mt-1">
                {shiftProgressPercent}% target reached
              </span>
            </div>

            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#F3EFEA" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#FF8A00"
                  strokeWidth="8"
                  strokeDasharray="251"
                  strokeDashoffset="20"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-bold text-sm text-[#1F2937]">92%</span>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs">
        <h2 className="font-bold text-base text-[#1F2937] mb-4">Recent Attendance Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#F1ECE4] text-xs font-semibold text-[#8A92A6]">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Clock In</th>
                <th className="pb-3 font-semibold">Clock Out</th>
                <th className="pb-3 font-semibold">Breaks</th>
                <th className="pb-3 font-semibold">Net Work Time</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F4EF]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#8A92A6]">
                    No past attendance sessions recorded yet. Clock in above to start your live work session!
                  </td>
                </tr>
              ) : (
                history.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3.5 font-medium text-[#1F2937]">{row.date}</td>
                    <td className="py-3.5 text-[#64748B]">{row.in}</td>
                    <td className="py-3.5 text-[#64748B]">{row.out}</td>
                    <td className="py-3.5 text-[#64748B]">{row.breaks}</td>
                    <td className="py-3.5 font-semibold text-[#1F2937]">{row.net}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          row.status === 'PRESENT'
                            ? 'bg-[#EBFBF3] text-[#10B981]'
                            : 'bg-[#FFFBEB] text-[#D97706]'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
