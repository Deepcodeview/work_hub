'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  ChevronRight,
  TrendingUp,
} from '../../components/icons';
import { api } from '../../lib/api';

interface PayslipItem {
  id: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  daysWorked: number;
  status: string;
  createdAt: string;
  payrollRun?: { payPeriodMonth: number; payPeriodYear: number; status: string };
}

export default function PayrollPage() {
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const [slipRes, runRes] = await Promise.all([
        api.hrms.getMyPayslips(),
        api.hrms.getPayrollRuns(),
      ]);

      if (slipRes.success && Array.isArray(slipRes.data)) {
        setPayslips(slipRes.data);
      } else {
        setPayslips([]);
      }

      if (runRes.success && Array.isArray(runRes.data)) {
        setRuns(runRes.data);
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleRunPayroll = async () => {
    try {
      const now = new Date();
      const res = await api.hrms.createPayrollRun({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Automated payroll batch executed successfully!' });
        fetchPayrollData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Payroll run completed or pending' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Execution failed' });
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
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Payroll & Compensation</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Automated payroll calculation, tax deductions, and official digital payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3.5 py-1.5 rounded-full border border-[#DCFCE7] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            Direct Deposit Active
          </span>
          <button
            onClick={handleRunPayroll}
            className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Run Payroll</span>
          </button>
        </div>
      </div>

      {/* 3 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs">
          <span className="text-xs font-bold text-[#8A92A6] block mb-1">Latest Net Disbursed</span>
          <span className="text-2xl font-extrabold text-[#16A34A] block tracking-tight">
            $6,650.00
          </span>
          <span className="text-[11px] text-[#8A92A6]">Directly credited to checking account</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs">
          <span className="text-xs font-bold text-[#8A92A6] block mb-1">Standard Deductions</span>
          <span className="text-2xl font-extrabold text-[#DC2626] block tracking-tight">
            $1,850.00
          </span>
          <span className="text-[11px] text-[#8A92A6]">Federal tax, State tax, Social Security</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs">
          <span className="text-xs font-bold text-[#8A92A6] block mb-1">Year-to-Date Gross</span>
          <span className="text-2xl font-extrabold text-[#1F2937] block tracking-tight">
            $102,000.00
          </span>
          <span className="text-[11px] text-[#8A92A6]">Based on official base salary compensation</span>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs overflow-hidden">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">Official Payslips History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#F1ECE4] text-xs font-semibold text-[#8A92A6]">
                <th className="pb-3 font-semibold">Pay Period</th>
                <th className="pb-3 font-semibold">Days Worked</th>
                <th className="pb-3 font-semibold">Gross Pay</th>
                <th className="pb-3 font-semibold">Deductions</th>
                <th className="pb-3 font-semibold">Net Disbursed</th>
                <th className="pb-3 text-right pr-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F4EF]">
              {payslips.map((slip) => {
                const monthIndex = (slip.payrollRun?.payPeriodMonth || 1) - 1;
                const monthName = monthNames[monthIndex] || 'January';
                const year = slip.payrollRun?.payPeriodYear || 2025;

                return (
                  <tr key={slip.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-4">
                      <span className="font-semibold text-sm text-[#1F2937] block">
                        {monthName} {year}
                      </span>
                      <span className="text-xs text-[#8A92A6]">
                        Issued {new Date(slip.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-medium text-[#475569]">
                      {slip.daysWorked} days
                    </td>
                    <td className="py-4 text-xs font-bold font-mono text-[#1F2937]">
                      ${slip.grossPay.toLocaleString()}
                    </td>
                    <td className="py-4 text-xs font-bold font-mono text-[#DC2626]">
                      -${slip.deductions.toLocaleString()}
                    </td>
                    <td className="py-4 text-sm font-extrabold font-mono text-[#16A34A]">
                      ${slip.netPay.toLocaleString()}
                    </td>
                    <td className="py-4 text-right pr-4">
                      <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#DCFCE7]">
                        {slip.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
