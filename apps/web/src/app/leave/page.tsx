'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  X,
  ChevronRight,
} from '../../components/icons';
import { api } from '../../lib/api';

interface LeaveBalanceItem {
  id: string;
  year: number;
  totalAccruedDays: number;
  usedDays: number;
  pendingDays: number;
  leaveType: { id: string; name: string; code: string; annualQuotaDays?: number };
}

interface LeaveRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: string;
  createdAt: string;
  leaveType: { name: string };
}

export default function LeavePage() {
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, reqRes, typesRes] = await Promise.all([
        api.hrms.getLeaveBalances(),
        api.hrms.getMyLeaves(),
        api.hrms.getLeaveTypes(),
      ]);

      if (balRes.success && Array.isArray(balRes.data)) setBalances(balRes.data);
      if (reqRes.success && Array.isArray(reqRes.data)) setRequests(reqRes.data);
      if (typesRes.success && Array.isArray(typesRes.data)) {
        setLeaveTypes(typesRes.data);
        if (typesRes.data.length > 0 && !form.leaveTypeId) {
          setForm((prev) => ({ ...prev, leaveTypeId: typesRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching leave details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.hrms.applyLeave({
        leaveTypeId: form.leaveTypeId || leaveTypes[0]?.id,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });

      if (res.success) {
        setShowApplyModal(false);
        setFeedback({ type: 'success', message: 'Leave application submitted for approval!' });
        setForm({
          leaveTypeId: leaveTypes[0]?.id || '',
          startDate: '',
          endDate: '',
          reason: '',
        });
        fetchData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to submit leave application' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Submission error' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold shadow-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Leave Management</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            View annual leave entitlements, apply for time off, and track approvals.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Request Leave</span>
        </button>
      </div>

      {/* Leave Balances Cards */}
      {balances.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-8 text-center shadow-xs">
          <Calendar className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
          <p className="font-semibold text-sm text-[#1F2937] mb-1">No Leave Accruals Recorded</p>
          <p className="text-xs text-[#8A92A6]">Leave quotas and balances will appear once allocated by organization HR.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {balances.map((b: any) => {
          const available = (b.totalAccruedDays || 20) - (b.usedDays || 0) - (b.pendingDays || 0);
          return (
            <div key={b.id} className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs">
              <span className="text-xs font-bold text-[#8A92A6] block mb-1">
                {b.leaveType?.name}
              </span>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-[#1F2937] tracking-tight">
                  {available}
                </span>
                <span className="text-xs text-[#8A92A6]">
                  / {b.totalAccruedDays || b.leaveType?.annualQuotaDays || 20} days
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF8A00] rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((available) / (b.totalAccruedDays || 20)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Leave History Table */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs overflow-hidden">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">My Leave History</h2>
        {requests.length === 0 ? (
          <div className="text-center py-10 text-[#8A92A6] text-xs">
            <Calendar className="w-8 h-8 text-[#FF8A00] mx-auto mb-2 opacity-80" />
            No leave requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F1ECE4] text-xs font-semibold text-[#8A92A6]">
                  <th className="pb-3 font-semibold">Leave Type</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Days</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 text-right pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F4EF]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-4 font-semibold text-sm text-[#1F2937]">
                      {req.leaveType?.name || 'Annual Leave'}
                    </td>
                    <td className="py-4 text-xs text-[#64748B]">
                      {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-xs font-bold text-[#1F2937]">
                      {req.daysCount} days
                    </td>
                    <td className="py-4 text-xs text-[#64748B] max-w-xs truncate">
                      {req.reason || 'Personal'}
                    </td>
                    <td className="py-4 text-right pr-4">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                          req.status === 'APPROVED'
                            ? 'text-[#16A34A] bg-[#F0FDF4] border-[#DCFCE7]'
                            : req.status === 'REJECTED'
                            ? 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]'
                            : 'text-[#D97706] bg-[#FFFBEB] border-[#FEF3C7]'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
              <h2 className="text-base font-bold text-[#1F2937]">Request Leave</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Leave Category</label>
                <select
                  value={form.leaveTypeId}
                  onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.annualQuotaDays} days/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Reason / Notes</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Provide context for manager review..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
