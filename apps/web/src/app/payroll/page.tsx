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
  Search,
  Printer,
  Download,
  Building2,
  Users,
  ShieldCheck,
  X,
  FileText,
  Calendar,
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
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
    department?: { name: string };
    designation?: { title: string };
  };
  payrollRun?: { payPeriodMonth: number; payPeriodYear: number; status: string };
}

interface PayrollRunItem {
  id: string;
  payPeriodMonth: number;
  payPeriodYear: number;
  status: string;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  createdAt: string;
  approvedAt?: string;
  _count?: { payslips: number };
}

interface SalaryAssignmentItem {
  id: string;
  baseSalary: number;
  paymentMethod: string;
  effectiveDate: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
    department?: { name: string };
    designation?: { title: string };
  };
  structure?: {
    name: string;
    code: string;
    currency: string;
    components?: any[];
  };
}

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<'runs' | 'payslips' | 'compensation'>('payslips');
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);
  const [runs, setRuns] = useState<PayrollRunItem[]>([]);
  const [assignments, setAssignments] = useState<SalaryAssignmentItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Run Batch Modal
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isProcessingRun, setIsProcessingRun] = useState(false);

  // Paystub Modal
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipItem | null>(null);

  // Compensation Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [assignBaseSalary, setAssignBaseSalary] = useState('75000');
  const [assignPaymentMethod, setAssignPaymentMethod] = useState('DIRECT_DEPOSIT');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const [allSlipsRes, runRes, assignRes, empRes] = await Promise.all([
        api.hrms.getAllPayslips().catch(() => api.hrms.getMyPayslips()),
        api.hrms.getPayrollRuns(),
        api.hrms.getSalaryAssignments().catch(() => ({ success: false, data: [] })),
        api.organization.getEmployees().catch(() => ({ success: false, data: [] })),
      ]);

      if (allSlipsRes.success && Array.isArray(allSlipsRes.data)) {
        setPayslips(allSlipsRes.data);
      } else {
        // Fallback to my payslips
        const mySlips = await api.hrms.getMyPayslips();
        if (mySlips.success && Array.isArray(mySlips.data)) {
          setPayslips(mySlips.data);
        } else {
          setPayslips([]);
        }
      }

      if (runRes.success && Array.isArray(runRes.data)) {
        setRuns(runRes.data);
      }

      if (assignRes.success && Array.isArray(assignRes.data)) {
        setAssignments(assignRes.data);
      }

      if (empRes.success && Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
        if (empRes.data.length > 0 && !selectedEmpId) {
          setSelectedEmpId(empRes.data[0].id);
        }
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

  const handleRunPayrollBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingRun(true);
    try {
      const res = await api.hrms.createPayrollRun({
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `🎉 Payroll batch for ${monthNames[selectedMonth - 1]} ${selectedYear} executed successfully!`,
        });
        setIsRunModalOpen(false);
        fetchPayrollData();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || `A payroll batch for ${monthNames[selectedMonth - 1]} ${selectedYear} has already been processed.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Payroll execution failed.' });
    } finally {
      setIsProcessingRun(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleSaveCompensation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    try {
      const res = await api.hrms.assignSalary({
        employeeId: selectedEmpId,
        baseSalary: parseFloat(assignBaseSalary) || 75000,
        paymentMethod: assignPaymentMethod,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Employee compensation package updated successfully!',
        });
        setIsAssignModalOpen(false);
        fetchPayrollData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update compensation.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating compensation.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Compute live aggregates from actual payslips
  const totalNetDisbursed = payslips.reduce((sum, p) => sum + (p.netPay || 0), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.deductions || 0), 0);
  const totalGrossPayroll = payslips.reduce((sum, p) => sum + (p.grossPay || 0), 0);

  const filteredPayslips = payslips.filter((slip) => {
    const term = searchTerm.toLowerCase();
    const empName = slip.employee ? `${slip.employee.firstName} ${slip.employee.lastName}`.toLowerCase() : '';
    const empCode = slip.employee?.employeeCode?.toLowerCase() || '';
    const month = (slip.payrollRun?.payPeriodMonth ? monthNames[slip.payrollRun.payPeriodMonth - 1] : '').toLowerCase();
    const year = (slip.payrollRun?.payPeriodYear || '').toString();

    return empName.includes(term) || empCode.includes(term) || month.includes(term) || year.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold shadow-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A] dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626] dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111827] border border-[#F1ECE4] dark:border-gray-800 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00] bg-[#FFF5EB] dark:bg-[#FF7A00]/10 px-2.5 py-0.5 rounded-full">
              Enterprise HRMS
            </span>
            <span className="text-xs font-medium text-[#8A92A6] dark:text-gray-400">• Disbursal & Compliance</span>
          </div>
          <h1 className="text-2xl font-black text-[#1F2937] dark:text-white tracking-tight">
            Payroll & Compensation Center
          </h1>
          <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
            Manage automated monthly payroll batches, statutory tax withholding, pay stub generation, and compensation packages.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2.5 rounded-full bg-[#FAF7F2] dark:bg-gray-800 hover:bg-[#F0ECE1] dark:hover:bg-gray-700 text-[#475569] dark:text-gray-200 text-xs font-bold border border-[#E2E8F0] dark:border-gray-700 flex items-center gap-1.5 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span>Salary Package</span>
          </button>

          <button
            onClick={() => setIsRunModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Run Payroll Batch</span>
          </button>
        </div>
      </div>

      {/* 4 Live Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Total Net Disbursed</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#16A34A] dark:text-emerald-400 block tracking-tight font-mono">
            ${totalNetDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Processed through automated ACH</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Statutory Deductions</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#DC2626] dark:text-rose-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#DC2626] dark:text-rose-400 block tracking-tight font-mono">
            ${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Federal, State tax & FICA withholding</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Total Gross Payroll</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#1F2937] dark:text-white block tracking-tight font-mono">
            ${totalGrossPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Base salary & employee allowances</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Official Payslips</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block tracking-tight font-mono">
            {payslips.length} Issued
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Verified digital payment stubs</span>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center p-1 bg-[#F5F2EB] dark:bg-gray-800/80 rounded-full border border-[#EBE4D8] dark:border-gray-700">
          <button
            onClick={() => setActiveTab('payslips')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'payslips'
                ? 'bg-white dark:bg-gray-700 text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-white'
            }`}
          >
            Official Payslips ({payslips.length})
          </button>
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'runs'
                ? 'bg-white dark:bg-gray-700 text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-white'
            }`}
          >
            Payroll Batches ({runs.length})
          </button>
          <button
            onClick={() => setActiveTab('compensation')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'compensation'
                ? 'bg-white dark:bg-gray-700 text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] dark:text-gray-400 hover:text-[#1F2937] dark:hover:text-white'
            }`}
          >
            Salary Structures & Assignments
          </button>
        </div>

        {activeTab === 'payslips' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A92A6]" />
            <input
              type="text"
              placeholder="Search payslips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-[#E2E8F0] dark:border-gray-700 rounded-full text-xs text-[#1F2937] dark:text-white placeholder-[#8A92A6] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Payslips History */}
      {activeTab === 'payslips' && (
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F1ECE4] dark:border-gray-800 text-xs font-semibold text-[#8A92A6] dark:text-gray-400">
                  <th className="pb-3">Pay Period</th>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Days Worked</th>
                  <th className="pb-3 text-right">Gross Pay</th>
                  <th className="pb-3 text-right">Deductions</th>
                  <th className="pb-3 text-right">Net Disbursed</th>
                  <th className="pb-3 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F4EF] dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#8A92A6]">
                      Loading payslip records...
                    </td>
                  </tr>
                ) : filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <CreditCard className="w-8 h-8 text-[#8A92A6] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-[#1F2937] dark:text-white">No payslips found</p>
                      <p className="text-[11px] text-[#8A92A6] dark:text-gray-400 mt-1">
                        Run a payroll batch above to generate payslips for all active team members.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((slip) => {
                    const mIdx = (slip.payrollRun?.payPeriodMonth || 1) - 1;
                    const monthName = monthNames[mIdx] || 'Period';
                    const year = slip.payrollRun?.payPeriodYear || 2026;

                    return (
                      <tr key={slip.id} className="hover:bg-[#FAF7F2]/60 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3.5">
                          <span className="font-semibold text-xs text-[#1F2937] dark:text-white block">
                            {monthName} {year}
                          </span>
                          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">
                            Issued {new Date(slip.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-semibold text-xs text-[#1F2937] dark:text-white block">
                            {slip.employee ? `${slip.employee.firstName} ${slip.employee.lastName}` : 'Active Employee'}
                          </span>
                          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400 font-mono">
                            {slip.employee?.employeeCode || 'EMP-1000'}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-[#475569] dark:text-gray-300">
                          {slip.daysWorked} days
                        </td>
                        <td className="py-3.5 text-xs font-mono font-bold text-right text-[#1F2937] dark:text-white">
                          ${slip.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-xs font-mono font-bold text-right text-[#DC2626] dark:text-rose-400">
                          -${slip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-xs font-mono font-black text-right text-[#16A34A] dark:text-emerald-400">
                          ${slip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right pr-4">
                          <button
                            onClick={() => setSelectedPayslip(slip)}
                            className="px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-gray-800 hover:bg-[#F0ECE1] dark:hover:bg-gray-700 border border-[#E2E8F0] dark:border-gray-700 text-[11px] font-bold text-[#1F2937] dark:text-gray-200 transition-all flex items-center gap-1 ml-auto"
                          >
                            <FileText className="w-3 h-3 text-[#FF7A00]" />
                            <span>View Paystub</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payroll Batches & Runs */}
      {activeTab === 'runs' && (
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F1ECE4] dark:border-gray-800 text-xs font-semibold text-[#8A92A6] dark:text-gray-400">
                  <th className="pb-3">Pay Period</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Recipients</th>
                  <th className="pb-3 text-right">Total Gross</th>
                  <th className="pb-3 text-right">Withholding</th>
                  <th className="pb-3 text-right pr-4">Total Net Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F4EF] dark:divide-gray-800">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#8A92A6]">
                      No payroll runs executed yet. Click "Run Payroll Batch" above.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="hover:bg-[#FAF7F2]/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3.5">
                        <span className="font-bold text-xs text-[#1F2937] dark:text-white block">
                          {monthNames[run.payPeriodMonth - 1]} {run.payPeriodYear}
                        </span>
                        <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">
                          Processed {new Date(run.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="text-[11px] font-semibold text-[#16A34A] bg-[#F0FDF4] dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-[#DCFCE7] dark:border-emerald-800">
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-[#475569] dark:text-gray-300">
                        {run._count?.payslips || 1} employees
                      </td>
                      <td className="py-3.5 text-xs font-mono font-bold text-right text-[#1F2937] dark:text-white">
                        ${run.totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-xs font-mono font-bold text-right text-[#DC2626] dark:text-rose-400">
                        -${run.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-xs font-mono font-black text-right pr-4 text-[#16A34A] dark:text-emerald-400">
                        ${run.totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Salary Structures & Compensation */}
      {activeTab === 'compensation' && (
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1F2937] dark:text-white">Active Employee Compensation Packages</h2>
              <p className="text-xs text-[#8A92A6] dark:text-gray-400">
                Configured base annual compensation, salary structure tiers & payment methods.
              </p>
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#FF7A00] text-white text-xs font-bold hover:bg-[#E66E00] flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign / Adjust Package</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F1ECE4] dark:border-gray-800 text-xs font-semibold text-[#8A92A6] dark:text-gray-400">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Structure / Package</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3 text-right">Base Annual CTC</th>
                  <th className="pb-3 text-right pr-4">Monthly Net Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F4EF] dark:divide-gray-800">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#8A92A6]">
                      No compensation assignments configured yet. Click "Assign / Adjust Package".
                    </td>
                  </tr>
                ) : (
                  assignments.map((assign) => {
                    const monthlyGross = assign.baseSalary / 12;
                    const monthlyNet = monthlyGross * 0.85; // after 15% withholding

                    return (
                      <tr key={assign.id} className="hover:bg-[#FAF7F2]/60 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3.5">
                          <span className="font-semibold text-xs text-[#1F2937] dark:text-white block">
                            {assign.employee ? `${assign.employee.firstName} ${assign.employee.lastName}` : 'Employee'}
                          </span>
                          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400 font-mono">
                            {assign.employee?.employeeCode} • {assign.employee?.department?.name || 'Operations'}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-[#475569] dark:text-gray-300">
                          {assign.structure?.name || 'Standard Enterprise Package'}
                        </td>
                        <td className="py-3.5">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            {assign.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs font-mono font-bold text-right text-[#1F2937] dark:text-white">
                          ${assign.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}/yr
                        </td>
                        <td className="py-3.5 text-xs font-mono font-black text-right pr-4 text-[#16A34A] dark:text-emerald-400">
                          ~${monthlyNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Run Payroll Batch */}
      {isRunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF7A00]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#1F2937] dark:text-white">Execute Payroll Batch</h3>
              </div>
              <button
                onClick={() => setIsRunModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8A92A6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] dark:text-gray-400 mb-4">
              Select the target pay period. This automated batch calculates base compensation, applies 15% statutory withholding, and issues digital pay stubs to all active employees.
            </p>

            <form onSubmit={handleRunPayrollBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                    Pay Period Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                    Fiscal Year
                  </label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono font-bold text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF5EB] dark:bg-[#FF7A00]/10 border border-[#FFE2C8] dark:border-[#FF7A00]/20 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#64748B] dark:text-gray-300">
                  Direct deposit instructions will be verified against banking credentials. An immutable audit trail entry will be registered upon execution.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRunModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E2E8F0] dark:border-gray-700 text-xs font-bold text-[#475569] dark:text-gray-300 hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRun}
                  className="px-5 py-2 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold shadow-sm transition-all active:scale-98 disabled:opacity-50"
                >
                  {isProcessingRun ? 'Processing Run...' : 'Execute Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Compensation Package */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#1F2937] dark:text-white">Adjust Compensation Package</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8A92A6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompensation} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                  Select Employee *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                  Base Annual Salary (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A92A6]">$</span>
                  <input
                    type="number"
                    required
                    value={assignBaseSalary}
                    onChange={(e) => setAssignBaseSalary(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono font-bold text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                  Disbursal Method
                </label>
                <select
                  value={assignPaymentMethod}
                  onChange={(e) => setAssignPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                >
                  <option value="DIRECT_DEPOSIT">Direct Deposit (Automated ACH)</option>
                  <option value="BANK_TRANSFER">International Bank Wire</option>
                  <option value="CHECK">Physical Corporate Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E2E8F0] dark:border-gray-700 text-xs font-bold text-[#475569] dark:text-gray-300 hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold shadow-sm transition-all active:scale-98"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Paystub Printable Document */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Paystub Top Action Bar */}
            <div className="px-6 py-4 bg-[#FAF7F2] dark:bg-gray-800/80 border-b border-[#F1ECE4] dark:border-gray-800 flex justify-between items-center print:hidden">
              <span className="text-xs font-bold text-[#FF7A00] uppercase tracking-wider">
                Official Earnings Statement
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8A92A6]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Printable Paystub Document */}
            <div className="p-8 space-y-6 text-[#1F2937] dark:text-white bg-white dark:bg-[#111827]">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[#FF7A00] text-white flex items-center justify-center font-black text-sm">
                      W
                    </div>
                    <span className="font-extrabold text-base tracking-tight">WorkHub Corporation</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-gray-400">
                    100 Enterprise Blvd, Suite 500 • New York, NY 10001
                  </p>
                  <p className="text-[11px] text-[#64748B] dark:text-gray-400">EIN: 12-3456789</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FF7A00] block">
                    Direct Deposit Paystub
                  </span>
                  <span className="text-xs font-bold font-mono text-[#1F2937] dark:text-white block">
                    Period: {monthNames[(selectedPayslip.payrollRun?.payPeriodMonth || 1) - 1]}{' '}
                    {selectedPayslip.payrollRun?.payPeriodYear || 2026}
                  </span>
                  <span className="text-[11px] text-[#8A92A6] dark:text-gray-400 block">
                    Issued: {new Date(selectedPayslip.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Employee & Payment Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/40 border border-[#F1ECE4] dark:border-gray-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A92A6] block mb-0.5">Employee</span>
                  <span className="font-bold text-sm block">
                    {selectedPayslip.employee
                      ? `${selectedPayslip.employee.firstName} ${selectedPayslip.employee.lastName}`
                      : 'Valued Personnel'}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-gray-400 font-mono">
                    ID: {selectedPayslip.employee?.employeeCode || 'EMP-1000'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#8A92A6] block mb-0.5">Disbursal Method</span>
                  <span className="font-bold text-xs block text-emerald-600 dark:text-emerald-400">
                    Direct Deposit (Checking •••• 4829)
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-gray-400">
                    Days Credited: {selectedPayslip.daysWorked} days
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-1 mb-2">
                    Earnings
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B] dark:text-gray-400">Base Salary</span>
                      <span className="font-mono font-bold">
                        ${selectedPayslip.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-gray-200 dark:border-gray-800 font-bold">
                      <span>Total Gross Pay</span>
                      <span className="font-mono">
                        ${selectedPayslip.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-1 mb-2">
                    Statutory Deductions
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B] dark:text-gray-400">Federal Tax (10%)</span>
                      <span className="font-mono text-[#DC2626] dark:text-rose-400">
                        -${(selectedPayslip.grossPay * 0.1).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B] dark:text-gray-400">State & Local Tax (3%)</span>
                      <span className="font-mono text-[#DC2626] dark:text-rose-400">
                        -${(selectedPayslip.grossPay * 0.03).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B] dark:text-gray-400">FICA & Medicare (2%)</span>
                      <span className="font-mono text-[#DC2626] dark:text-rose-400">
                        -${(selectedPayslip.grossPay * 0.02).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-gray-200 dark:border-gray-800 font-bold text-[#DC2626] dark:text-rose-400">
                      <span>Total Deductions</span>
                      <span className="font-mono">
                        -${selectedPayslip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Grand Box */}
              <div className="p-4 rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide block">
                    Net Take-Home Disbursed
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-500">
                    Transferred to employee direct deposit account
                  </span>
                </div>
                <span className="text-2xl font-black font-mono text-[#16A34A] dark:text-emerald-400">
                  ${selectedPayslip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
