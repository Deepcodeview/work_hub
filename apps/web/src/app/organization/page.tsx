'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  ShieldCheck,
  Network,
  Plus,
  Search,
  MoreHorizontal,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  X,
} from '../../components/icons';
import { api } from '../../lib/api';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'roles' | 'structure'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Employee Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes, treeRes] = await Promise.all([
        api.organization.getEmployees(),
        api.organization.getDepartments(),
        api.organization.getTree(),
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
      if (treeRes.success && Array.isArray(treeRes.data)) {
        setOrgTree(treeRes.data);
      }
    } catch (err) {
      console.error('Error loading organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFeedback({ type: 'error', message: 'First name, last name, and work email are required.' });
      return;
    }

    try {
      const res = await api.organization.createEmployee({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        workEmail: email.trim().toLowerCase(),
        employeeCode: employeeCode.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        departmentId: selectedDeptId || departments[0]?.id,
        managerId: selectedManagerId || undefined,
        hireDate: new Date().toISOString().split('T')[0],
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Employee ${firstName} ${lastName} added successfully!` });
        setIsModalOpen(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setEmployeeCode('');
        setSelectedManagerId('');
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create employee.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating employee.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filter logic
  const filteredEmployees = employees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (e.workEmail && e.workEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept =
      departmentFilter === 'ALL' || e.departmentId === departmentFilter;
    const matchesStatus =
      statusFilter === 'ALL' || (e.status || 'ACTIVE') === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

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

      {/* Title & Subtabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Organization</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Manage enterprise headcount, hierarchical reporting trees, and departmental structures.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Subtabs Pill */}
          <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8]">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'employees'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'departments'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'roles'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Roles & Permissions
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'structure'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Reporting Structure
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {activeTab === 'employees' && (
        <>
          {/* Filter Row */}
          <div className="bg-white rounded-2xl border border-[#F1ECE4] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#FAF7F2] rounded-xl border border-[#E2DDD5] text-xs text-[#8A92A6] w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                className="w-full bg-transparent border-none outline-none text-xs text-[#1F2937] placeholder-[#9CA3AF]"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Employees Table matching reference */}
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#F1ECE4] text-xs font-semibold text-[#8A92A6]">
                    <th className="pb-3 font-semibold">Employee</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Manager</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right pr-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F4EF]">
                  {filteredEmployees.map((emp) => {
                    const initials = `${emp.firstName?.[0] || 'E'}${emp.lastName?.[0] || 'P'}`;
                    const managerName = emp.manager
                      ? `${emp.manager.firstName} ${emp.manager.lastName}`
                      : 'Maria Rivers';

                    return (
                      <tr key={emp.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E2E8F0] to-[#F1F5F9] border border-white text-xs font-bold text-[#475569] flex items-center justify-center shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-[#1F2937] block">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-xs text-[#8A92A6]">
                                {emp.workEmail || `${emp.firstName.toLowerCase()}@workhub.internal`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-medium text-[#475569]">
                          {emp.department?.name || 'Engineering'}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[10px] font-bold text-[#475569] flex items-center justify-center">
                              {managerName[0]}
                            </div>
                            <span className="text-xs text-[#1F2937] font-medium">
                              {managerName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#DCFCE7] inline-block">
                            {emp.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-4">
                          <button className="p-1 rounded-lg text-[#8A92A6] hover:text-[#1F2937] hover:bg-[#FAF7F2] transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'departments' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs divide-y divide-[#F7F4EF]">
          <h2 className="font-bold text-sm text-[#1F2937] mb-3">Enterprise Departments</h2>
          {departments.map((dept) => (
            <div key={dept.id} className="py-4 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-[#1F2937] block">{dept.name}</span>
                <span className="text-xs text-[#8A92A6]">Code: {dept.code}</span>
              </div>
              <span className="text-xs font-semibold text-[#FF7A00] bg-[#FFF0E0] px-3 py-1 rounded-full border border-[#FFE2C8]">
                Head: {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'Assigned'}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-[#1F2937]">Roles & Access Control Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { role: 'SYSTEM_ADMIN', desc: 'Full root access to all modules, audits, and enterprise settings' },
              { role: 'HR_ADMIN', desc: 'Employee onboarding, department assignment, and payroll execution' },
              { role: 'DEPARTMENT_HEAD', desc: 'Department budgeting, team approvals, and goal reviews' },
              { role: 'REPORTING_MANAGER', desc: 'Direct team attendance verification, timesheet approval, and leave grant' },
              { role: 'EMPLOYEE', desc: 'Self-service clock in, timesheet logging, and task board management' },
            ].map((r) => (
              <div key={r.role} className="p-4 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/50">
                <span className="font-bold text-xs text-[#FF7A00] block mb-1">{r.role}</span>
                <span className="text-xs text-[#64748B]">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'structure' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs">
          <h2 className="font-bold text-sm text-[#1F2937] mb-4">Hierarchical Reporting Tree</h2>
          {orgTree.length === 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2] max-w-sm">
                <span className="font-bold text-xs text-[#1F2937] block">Executive Leadership</span>
                <span className="text-xs text-[#8A92A6]">CEO / VP Engineering</span>
              </div>
              <div className="ml-8 border-l-2 border-[#E2DDD5] pl-6 space-y-3">
                <div className="p-3.5 rounded-2xl border border-[#F1ECE4] bg-white shadow-xs max-w-sm">
                  <span className="font-semibold text-xs text-[#1F2937] block">Engineering Management</span>
                  <span className="text-[11px] text-[#8A92A6]">Maria Rivers • 8 Direct Reports</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-[#F1ECE4] bg-white shadow-xs max-w-sm">
                  <span className="font-semibold text-xs text-[#1F2937] block">Product & Design</span>
                  <span className="text-[11px] text-[#8A92A6]">David Kim • 5 Direct Reports</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orgTree.map((node: any) => (
                <div key={node.id} className="p-4 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/60">
                  <span className="font-bold text-sm text-[#1F2937] block">
                    {node.firstName} {node.lastName}
                  </span>
                  <span className="text-xs text-[#8A92A6]">
                    {node.designation?.name || 'Lead'} • {node.reports?.length || 0} direct reports
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
              <h2 className="text-base font-bold text-[#1F2937]">Add New Employee</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Connor"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Work Email</label>
                <input
                  type="email"
                  placeholder="e.g. sarah.connor@workhub.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Employee Code</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-104"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Reporting Manager / Supervisor</label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                >
                  <option value="">None (Top Level / Direct Report to Executive)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
