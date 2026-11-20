'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'timesheet' | 'leave'>('all');
  const [teamCount, setTeamCount] = useState(0);
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
        setTeamCount(empRes.data.length);
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
            hoursOrDays: `${ts.totalMinutes ? (ts.totalMinutes / 60).toFixed(1) : 0}h`,
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

      setApprovals(items);
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
      setApprovals((prev) => prev.filter((i) => i.id !== item.id));
      setMessage({ type: 'success', text: `Approved ${item.type.toLowerCase()} for ${item.name}` });
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setMessage({ type: 'error', text: 'Action failed. Please try again.' });
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      if (item.type === 'TIMESHEET') {
        await api.timesheets.reject(item.id, 'Rejected via review');
      } else {
        await api.hrms.rejectLeave(item.id, 'Rejected');
      }
      setApprovals((prev) => prev.filter((i) => i.id !== item.id));
      setMessage({ type: 'success', text: `Rejected request for ${item.name}` });
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setMessage({ type: 'error', text: 'Action failed. Please try again.' });
    }
  };

  const filteredApprovals = approvals.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'timesheet') return item.type === 'TIMESHEET';
    if (activeTab === 'leave') return item.type === 'LEAVE';
    return true;
  });

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {message && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-[#EBFBF3] border-[#DCFCE7] text-[#10B981]'
              : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#EF4444]'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">Approvals & Reviews</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Review employee timesheet hours and pending leave applications.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8]">
          {(['all', 'timesheet', 'leave'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'timesheet' ? 'Timesheets' : 'Leaves'}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#EBFBF3] text-[#10B981] flex items-center justify-center font-bold">
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
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">0h</span>
            <span className="text-xs font-medium text-[#8A92A6]">Total Overdue Hours</span>
          </div>
        </div>
      </div>

      {/* Main Approvals Content */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base text-[#1F2937]">
            Pending Requests ({filteredApprovals.length})
          </h2>
        </div>

        {filteredApprovals.length === 0 ? (
          <div className="text-center py-16 text-[#8A92A6] text-xs">
            <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto mb-3 opacity-90" />
            <p className="font-semibold text-sm text-[#1F2937] mb-1">All Caught Up!</p>
            <p className="text-[#8A92A6]">No pending timesheets or leave requests require your approval right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApprovals.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-[#F3EFEA] hover:border-[#E2DDD5] transition-colors gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF2E5] text-[#FF7A00] flex items-center justify-center font-bold text-xs shrink-0">
                    {item.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#1F2937]">{item.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#64748B] border border-[#E2DDD5]">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-xs text-[#8A92A6]">
                      {item.role} • {item.date} ({item.hoursOrDays})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleReject(item)}
                    className="p-2 rounded-xl text-[#EF4444] hover:bg-[#FEF2F2] border border-[#FECACA] transition-colors"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleApprove(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
