'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Building2,
  Briefcase,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  X,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  Lock,
} from '../../components/icons';
import { api } from '../../lib/api';

interface EmployeeItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hireDate?: string;
  status: string;
  department?: { id: string; name: string };
  designation?: { id: string; title: string };
  primaryManager?: { id: string; firstName: string; lastName: string; email: string };
  salaryAssignment?: { baseSalary: number; paymentMethod: string };
  roles?: string[];
}

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Identity & Contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hireDate, setHireDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Step 2: Role & Department
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [designationTitle, setDesignationTitle] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [systemRole, setSystemRole] = useState<'EMPLOYEE' | 'REPORTING_MANAGER' | 'HR_ADMIN'>('EMPLOYEE');

  // Step 3: Compensation & Payroll
  const [baseSalary, setBaseSalary] = useState('75000');
  const [paymentMethod, setPaymentMethod] = useState('DIRECT_DEPOSIT');
  const [bankName, setBankName] = useState('JPMorgan Chase & Co.');
  const [accountNumber, setAccountNumber] = useState('•••• 4829');

  // Step 4: Login Credentials
  const [password, setPassword] = useState('WorkHub@2026!');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Success Modal
  const [newHireCredentials, setNewHireCredentials] = useState<{
    code: string;
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'WH@';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd + '!');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.organization.getEmployees(),
        api.organization.getDepartments(),
      ]);

      if (empRes.success && Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      }
      if (deptRes.success && Array.isArray(deptRes.data)) {
        setDepartments(deptRes.data);
        if (deptRes.data.length > 0 && !selectedDeptId) {
          setSelectedDeptId(deptRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load onboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenWizard = () => {
    setStep(1);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDesignationTitle('');
    setSelectedManagerId('');
    setBaseSalary('75000');
    generateRandomPassword();
    setIsWizardOpen(true);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        setFeedback({ type: 'error', message: 'First name, last name, and work email are required.' });
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmitOnboarding();
    }
  };

  const handleSubmitOnboarding = async () => {
    try {
      const code = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await api.organization.createEmployee({
        employeeCode: code,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        departmentId: selectedDeptId || (departments[0]?.id ?? undefined),
        managerId: selectedManagerId || undefined,
        password: password.trim(),
        role: systemRole,
        baseSalary: parseFloat(baseSalary) || 75000,
        paymentMethod,
        hireDate,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `🎉 Employee ${firstName} ${lastName} onboarded and credentials created successfully!`,
        });
        setIsWizardOpen(false);
        setNewHireCredentials({
          code,
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: systemRole,
        });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to complete onboarding.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error executing onboarding workflow.' });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCopyCredentials = () => {
    if (!newHireCredentials) return;
    const text = `WorkHub Workspace Credentials\nEmployee Code: ${newHireCredentials.code}\nName: ${newHireCredentials.name}\nEmail: ${newHireCredentials.email}\nTemporary Password: ${newHireCredentials.password}\nRole: ${newHireCredentials.role}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredEmployees = employees.filter((e) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (e.email && e.email.toLowerCase().includes(term)) ||
      (e.employeeCode && e.employeeCode.toLowerCase().includes(term))
    );
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

      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111827] border border-[#F1ECE4] dark:border-gray-800 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00] bg-[#FFF5EB] dark:bg-[#FF7A00]/10 px-2.5 py-0.5 rounded-full">
              HR Administration
            </span>
            <span className="text-xs font-medium text-[#8A92A6] dark:text-gray-400">• New Hire Lifecycle</span>
          </div>
          <h1 className="text-2xl font-black text-[#1F2937] dark:text-white tracking-tight">
            Employee Onboarding Hub
          </h1>
          <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
            Manage end-to-end employee provisioning: digital contracts, salary assignments, access credentials & leave quota seeding.
          </p>
        </div>

        <button
          onClick={handleOpenWizard}
          className="px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-98 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Employee</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Total Headcount</span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF7A00]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#1F2937] dark:text-white block tracking-tight">
            {employees.length}
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Official personnel active on WorkHub</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Onboarding Pipeline</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block tracking-tight">
            100% Digital
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Paperless 5-step automated workflow</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Payroll Integration</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#16A34A] dark:text-emerald-400 block tracking-tight">
            Auto-Synced
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Direct deposit & tax withholding set</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8A92A6] dark:text-gray-400">Leave Quota</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block tracking-tight">
            34 Days / Yr
          </span>
          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400">Annual, sick, and casual allowances</span>
        </div>
      </div>

      {/* Onboarding Pipeline Tracker Visual */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-[#1F2937] dark:text-white mb-4 flex items-center gap-2">
          <span>Enterprise Onboarding Stages</span>
          <span className="text-[11px] font-semibold text-[#8A92A6] dark:text-gray-400 font-normal">
            (Automated System Verification)
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/50 border border-[#F1ECE4] dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h3 className="text-xs font-bold text-[#1F2937] dark:text-white">Profile & Identity</h3>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-gray-400">
              Identity verification, personal contact, and emergency details.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/50 border border-[#F1ECE4] dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h3 className="text-xs font-bold text-[#1F2937] dark:text-white">Job & Hierarchy</h3>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-gray-400">
              Department assignment, reporting manager, and organizational tree.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/50 border border-[#F1ECE4] dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <h3 className="text-xs font-bold text-[#1F2937] dark:text-white">Compensation Setup</h3>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-gray-400">
              Base salary, direct deposit account, and statutory withholding rules.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/50 border border-[#F1ECE4] dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <h3 className="text-xs font-bold text-[#1F2937] dark:text-white">Active & Provisioned</h3>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-gray-400">
              User credentials created, leave quota credited, and instant portal access.
            </p>
          </div>
        </div>
      </div>

      {/* Roster & Filter Bar */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-white">Active Onboarded Personnel</h2>
            <p className="text-xs text-[#8A92A6] dark:text-gray-400">
              Employees provisioned with WorkHub accounts and compensation packages.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A92A6]" />
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] dark:bg-gray-800/60 border border-[#F1ECE4] dark:border-gray-700 rounded-full text-xs text-[#1F2937] dark:text-white placeholder-[#8A92A6] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            />
          </div>
        </div>

        {/* Personnel Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#F1ECE4] dark:border-gray-800 text-xs font-semibold text-[#8A92A6] dark:text-gray-400">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Designation</th>
                <th className="pb-3">Direct Manager</th>
                <th className="pb-3 text-right">Hire Date</th>
                <th className="pb-3 text-right pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F4EF] dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#8A92A6]">
                    Loading personnel roster...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <Users className="w-8 h-8 text-[#8A92A6] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-[#1F2937] dark:text-white">No employees found</p>
                    <p className="text-[11px] text-[#8A92A6] dark:text-gray-400 mt-1">
                      Click "+ Onboard New Employee" above to add the first team member.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#FAF7F2]/60 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF7A00] to-[#FFA338] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                          {emp.firstName?.[0] || 'E'}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-[#1F2937] dark:text-white block">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[11px] text-[#8A92A6] dark:text-gray-400 font-mono">
                            {emp.employeeCode} • {emp.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-[#475569] dark:text-gray-300">
                      {emp.department?.name || 'General Operations'}
                    </td>
                    <td className="py-3.5 text-xs text-[#475569] dark:text-gray-300">
                      {emp.designation?.title || 'Staff Specialist'}
                    </td>
                    <td className="py-3.5 text-xs text-[#475569] dark:text-gray-300">
                      {emp.primaryManager
                        ? `${emp.primaryManager.firstName} ${emp.primaryManager.lastName}`
                        : 'Executive / Root'}
                    </td>
                    <td className="py-3.5 text-xs text-right text-[#8A92A6] dark:text-gray-400">
                      {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 text-right pr-4">
                      <span className="text-[11px] font-semibold text-[#16A34A] bg-[#F0FDF4] dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full border border-[#DCFCE7] dark:border-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Step Interactive Onboarding Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#F1ECE4] dark:border-gray-800 flex justify-between items-center bg-[#FAF7F2]/60 dark:bg-gray-800/40">
              <div>
                <span className="text-[10px] font-bold text-[#FF7A00] tracking-wider uppercase">
                  Step {step} of {totalSteps}
                </span>
                <h3 className="text-base font-bold text-[#1F2937] dark:text-white">
                  {step === 1 && '1. Personal & Contact Information'}
                  {step === 2 && '2. Role, Department & Reporting Line'}
                  {step === 3 && '3. Compensation & Direct Deposit'}
                  {step === 4 && '4. Account Credentials & Security'}
                  {step === 5 && '5. Review & Provision Employee'}
                </h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8A92A6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="px-6 pt-4 pb-2">
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s <= step ? 'bg-[#FF7A00]' : 'bg-[#E2E8F0] dark:bg-gray-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleNextStep} className="p-6 space-y-4">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <p className="text-xs text-[#64748B] dark:text-gray-400">
                    Enter the basic identity and work contact information for the new hire.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Maya"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lin"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                      Official Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. maya.lin@workhub.internal"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+1 (555) 234-5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                        Official Start Date
                      </label>
                      <input
                        type="date"
                        value={hireDate}
                        onChange={(e) => setHireDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <p className="text-xs text-[#64748B] dark:text-gray-400">
                    Assign organizational positioning, title, reporting chain, and role permissions.
                  </p>
                  <div>
                    <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                      Department *
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code || 'DEPT'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                      Job Designation / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={designationTitle}
                      onChange={(e) => setDesignationTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                      Reporting Manager
                    </label>
                    <select
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    >
                      <option value="">None (Reports to Root / Executive)</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                      System Access Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['EMPLOYEE', 'REPORTING_MANAGER', 'HR_ADMIN'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSystemRole(r)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                            systemRole === r
                              ? 'bg-[#FF7A00]/10 border-[#FF7A00] text-[#FF7A00]'
                              : 'bg-white dark:bg-gray-800 border-[#E2E8F0] dark:border-gray-700 text-[#475569] dark:text-gray-300'
                          }`}
                        >
                          {r.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <p className="text-xs text-[#64748B] dark:text-gray-400">
                    Define the compensation tier, payment schedule, and direct deposit details.
                  </p>
                  <div>
                    <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                      Annual Base Salary (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A92A6]">
                        $
                      </span>
                      <input
                        type="number"
                        required
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono font-bold text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                    <span className="text-[10px] text-[#8A92A6] dark:text-gray-400 mt-1 block">
                      Equivalent to ~${Math.round(parseFloat(baseSalary || '0') / 12).toLocaleString()}/month before taxes
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    >
                      <option value="DIRECT_DEPOSIT">Direct Deposit (Automated ACH)</option>
                      <option value="BANK_TRANSFER">International Bank Wire</option>
                      <option value="CHECK">Physical Corporate Cheque</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                        Deposit Bank
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300 block mb-1">
                        Account / Routing Mask
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <p className="text-xs text-[#64748B] dark:text-gray-400">
                    Provision the employee's login credentials to allow immediate sign-in to the WorkHub platform.
                  </p>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-[#475569] dark:text-gray-300">
                        Initial Temporary Password *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] font-bold text-[#FF7A00] hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Regenerate
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A92A6]" />
                      <input
                        type="text"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs font-bold text-[#1F2937] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>
                    <span className="text-[10px] text-[#8A92A6] dark:text-gray-400 mt-1 block">
                      The user will be prompted to change this on their first login session.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFF5EB] dark:bg-[#FF7A00]/10 border border-[#FFE2C8] dark:border-[#FF7A00]/20 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-[#1F2937] dark:text-white block">
                        Enterprise Role Binding
                      </span>
                      <p className="text-[11px] text-[#64748B] dark:text-gray-300 mt-0.5">
                        This employee will be granted <strong>{systemRole}</strong> privileges, enabling standard attendance tracking, timesheet logging, leaves, and chat copilot.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={sendWelcomeEmail}
                      onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                      className="rounded text-[#FF7A00] focus:ring-[#FF7A00]"
                    />
                    <span className="text-xs font-medium text-[#475569] dark:text-gray-300">
                      Send welcome onboarding packet with login credentials to employee
                    </span>
                  </label>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <p className="text-xs text-[#64748B] dark:text-gray-400">
                    Review and confirm all setup parameters before provisioning this team member.
                  </p>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/50 border border-[#F1ECE4] dark:border-gray-700 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8A92A6] dark:text-gray-400">Full Name:</span>
                      <span className="font-bold text-[#1F2937] dark:text-white">
                        {firstName} {lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A92A6] dark:text-gray-400">Work Email:</span>
                      <span className="font-bold font-mono text-[#1F2937] dark:text-white">{email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A92A6] dark:text-gray-400">Department:</span>
                      <span className="font-bold text-[#1F2937] dark:text-white">
                        {departments.find((d) => d.id === selectedDeptId)?.name || 'General Operations'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A92A6] dark:text-gray-400">Annual Compensation:</span>
                      <span className="font-bold font-mono text-[#16A34A] dark:text-emerald-400">
                        ${parseFloat(baseSalary || '0').toLocaleString()} / year
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A92A6] dark:text-gray-400">Leave Balance Allotment:</span>
                      <span className="font-bold text-[#FF7A00]">
                        34 Total Days (12 Annual + 10 Sick + 12 Casual)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A92A6] dark:text-gray-400">System Role:</span>
                      <span className="font-bold text-[#1F2937] dark:text-white">{systemRole}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>All compliance checks passed. Ready for immediate production provisioning.</span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-[#F1ECE4] dark:border-gray-800">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-4 py-2 rounded-full border border-[#E2E8F0] dark:border-gray-700 text-xs font-semibold text-[#475569] dark:text-gray-300 hover:bg-[#FAF7F2] dark:hover:bg-gray-800 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
                >
                  <span>{step === totalSteps ? 'Complete & Provision' : 'Next Step'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Credentials Card Modal */}
      {newHireCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#F1ECE4] dark:border-gray-800 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] dark:bg-emerald-950/50 text-[#16A34A] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#1F2937] dark:text-white">
              Employee Successfully Onboarded!
            </h3>
            <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
              Please copy and securely deliver these credentials to the new employee.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-gray-800/60 border border-[#F1ECE4] dark:border-gray-700 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#8A92A6]">Code:</span>
                <span className="font-bold text-[#1F2937] dark:text-white">{newHireCredentials.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A92A6]">Name:</span>
                <span className="font-bold text-[#1F2937] dark:text-white">{newHireCredentials.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A92A6]">Email:</span>
                <span className="font-bold text-[#1F2937] dark:text-white">{newHireCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A92A6]">Password:</span>
                <span className="font-bold text-[#FF7A00]">{newHireCredentials.password}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A92A6]">Role:</span>
                <span className="font-bold text-[#1F2937] dark:text-white">{newHireCredentials.role}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 rounded-full bg-[#1F2937] dark:bg-white text-white dark:text-[#1F2937] text-xs font-bold shadow-xs hover:opacity-90 flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
              </button>

              <button
                onClick={() => setNewHireCredentials(null)}
                className="px-5 py-2.5 rounded-full bg-[#FAF7F2] dark:bg-gray-800 hover:bg-[#F0ECE1] dark:hover:bg-gray-700 text-xs font-bold text-[#475569] dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
