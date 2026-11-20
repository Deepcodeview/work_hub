'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
  X,
  ArrowRight,
  TrendingUp,
} from '../../components/icons';
import { api } from '../../lib/api';

interface ApprovalItem {
  id: string;
  type: 'TIMESHEET' | 'LEAVE';
  name: string;
  role: string;
  date: string;
  hoursOrDays: string;
  avatar: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    { id: '1', type: 'TIMESHEET', name: 'Emily Davis', role: 'Product Designer', date: 'Jan 27', hoursOrDays: '8.0h', avatar: 'ED' },
    { id: '2', type: 'TIMESHEET', name: 'Michael Chen', role: 'Frontend Engineer', date: 'Jan 27', hoursOrDays: '7.5h', avatar: 'MC' },
    { id: '3', type: 'TIMESHEET', name: 'Sophia Martin', role: 'QA Specialist', date: 'Jan 27', hoursOrDays: '8.0h', avatar: 'SM' },
  ]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'timesheet' | 'leave'>('all');
  const [teamCount, setTeamCount] = useState(12);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      // Fetch pending timesheets
      const tsRes = await api.timesheets.getPendingApprovals();
      // Fetch pending leaves
      const lvRes = await api.hrms.getPendingLeaves();
      // Fetch employees for team count
      const empRes = await api.organization.getEmployees();
      if (empRes.success && Array.isArray(empRes.data)) {
        setTeamCount(empRes.data.length || 12);
      }

      const items: ApprovalItem[] = [];

      if (tsRes.success && Array.isArray(tsRes.data)) {
        tsRes.data.forEach((ts: any) => {
          items.push({
            id: ts.id,
            type: 'TIMESHEET',
            name: `${ts.employee?.firstName || 'Team'} ${ts.employee?.lastName || 'Member'}`,
            role: ts.employee?.designation?.name || 'Engineer',
            date: ts.periodStartDate ? new Date(ts.periodStartDate).toLocaleDateString() : 'This Week',
            hoursOrDays: `${ts.totalMinutes ? (ts.totalMinutes / 60).toFixed(1) : 40}h`,
            avatar: `${ts.employee?.firstName?.[0] || 'T'}${ts.employee?.lastName?.[0] || 'M'}`,
          });
        });
      }

      if (lvRes.success && Array.isArray(lvRes.data)) {
        lvRes.data.forEach((lv: any) => {
          items.push({
            id: lv.id,
            type: 'LEAVE',
            name: `${lv.employee?.firstName || 'Employee'} ${lv.employee?.lastName || ''}`,
            role: lv.leaveType?.name || 'Leave Request',
            date: `${new Date(lv.startDate).toLocaleDateString()} - ${new Date(lv.endDate).toLocaleDateString()}`,
            hoursOrDays: `${lv.daysCount || 1}d`,
            avatar: `${lv.employee?.firstName?.[0] || 'L'}${lv.employee?.lastName?.[0] || 'R'}`,
          });
        });
      }

      if (items.length > 0) {
        setApprovals(items);
      }
    } catch (err) {
      console.error('Error loading approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (item: ApprovalItem) => {
    try {
      if (item.type === 'TIMESHEET') {
        await api.timesheets.approve(item.id, 'Approved via team dashboard');
      } else {
        await api.hrms.approveLeave(item.id, 'Approved');
      }
      setApprovals((prev) => prev.filter((a) => a.id !== item.id));
      setMessage({ type: 'success', text: `Approved ${item.type.toLowerCase()} for ${item.name}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Approval failed' });
    }
    setTimeout(() => setMessage(null), 3500);
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      if (item.type === 'TIMESHEET') {
        await api.timesheets.reject(item.id, 'Returned for revision');
      } else {
        await api.hrms.rejectLeave(item.id, 'Declined due to team schedule');
      }
      setApprovals((prev) => prev.filter((a) => a.id !== item.id));
      setMessage({ type: 'error', text: `Returned ${item.type.toLowerCase()} for ${item.name} for revision` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Rejection failed' });
    }
    setTimeout(() => setMessage(null), 3500);
  };

  const filteredApprovals =
    activeTab === 'all'
      ? approvals
      : approvals.filter((a) => a.type.toLowerCase() === activeTab);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Team Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Review your direct reporting team members, daily attendance, and pending submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtabs Pill */}
          <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              All ({approvals.length})
            </button>
            <button
              onClick={() => setActiveTab('timesheet')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'timesheet'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Timesheets
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'leave'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Leaves
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 text-xs font-semibold rounded-2xl border flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-[#EBFBF3] border-[#DCFCE7] text-[#10B981]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-4 p-1">
            ✕
          </button>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FFF2E5] text-[#FF7A00] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {teamCount}
            </span>
            <span className="text-xs font-medium text-[#8A92A6]">Team Members</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#EBFBF3] text-[#10B981] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {Math.max(1, teamCount - 1)}
            </span>
            <span className="text-xs font-medium text-[#8A92A6]">Present Today</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {approvals.length}
            </span>
            <span className="text-xs font-medium text-[#8A92A6]">Pending Approvals</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">320h</span>
            <span className="text-xs font-medium text-[#8A92A6]">Total Hours</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Team Attendance Bar Chart & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Team Attendance Bar Chart (Cols 1-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-[#1F2937]">Team Attendance</h2>
              <span className="text-xs font-semibold text-[#8A92A6]">This Week</span>
            </div>

            {/* Custom rounded bar chart matching the image */}
            <div className="h-48 flex items-end justify-between px-6 pt-6 pb-2 gap-4">
              {[
                { day: 'Mon', height: '80%', count: 11 },
                { day: 'Tue', height: '92%', count: 12 },
                { day: 'Wed', height: '85%', count: 11 },
                { day: 'Thu', height: '100%', count: 12 },
                { day: 'Fri', height: '75%', count: 10 },
              ].map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-bold text-[#FF7A00] opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.count}
                  </span>
                  <div
                    className="w-full max-w-[42px] bg-gradient-to-t from-[#FF7A00] to-[#FFA338] rounded-t-xl transition-all duration-500 shadow-xs"
                    style={{ height: bar.height }}
                  ></div>
                  <span className="text-xs font-semibold text-[#8A92A6]">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Approvals List (Cols 8-12) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-[#1F2937]">
                Pending Approvals ({filteredApprovals.length})
              </h2>
              <button
                onClick={() => setActiveTab('all')}
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredApprovals.length === 0 ? (
              <div className="text-center py-10 text-[#8A92A6] text-xs">
                <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2 opacity-80" />
                All pending approvals have been completed.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-[#F1ECE4] hover:border-[#FFCCA0] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#E2E8F0] text-xs font-bold text-[#475569] flex items-center justify-center">
                        {item.avatar}
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-[#1F2937] block leading-tight">
                          {item.name}
                        </span>
                        <span className="text-xs text-[#8A92A6]">
                          {item.date} • <strong className="text-[#1F2937]">{item.hoursOrDays}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApprove(item)}
                        className="w-7 h-7 rounded-full bg-[#EBFBF3] text-[#10B981] hover:bg-[#10B981] hover:text-white transition-colors flex items-center justify-center shadow-2xs"
                        title="Approve"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => handleReject(item)}
                        className="w-7 h-7 rounded-full bg-[#FEF2F2] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-colors flex items-center justify-center shadow-2xs"
                        title="Reject"
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
