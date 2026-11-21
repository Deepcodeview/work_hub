'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  UserPlus,
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

  // Department Management state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHeadId, setDeptHeadId] = useState('');

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

  const openCreateDeptModal = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptDesc('');
    setDeptHeadId('');
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (dept: any) => {
    setEditingDept(dept);
    setDeptName(dept.name || '');
    setDeptCode(dept.code || '');
    setDeptDesc(dept.description || '');
    setDeptHeadId(dept.headId || dept.head?.id || '');
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || (!editingDept && !deptCode.trim())) {
      setFeedback({ type: 'error', message: 'Department name and unique code are required.' });
      return;
    }

    try {
      if (editingDept) {
        // Update existing department
        const res = await api.organization.updateDepartment(editingDept.id, {
          name: deptName.trim(),
          description: deptDesc.trim() || undefined,
          headId: deptHeadId || undefined,
        });
        if (res.success) {
          setFeedback({ type: 'success', message: `Department "${deptName}" updated successfully!` });
          setIsDeptModalOpen(false);
          loadData();
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to update department.' });
        }
      } else {
        // Create new department
        const res = await api.organization.createDepartment({
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
          description: deptDesc.trim() || undefined,
          headId: deptHeadId || undefined,
        });
        if (res.success) {
          setFeedback({ type: 'success', message: `Department "${deptName}" created successfully!` });
          setIsDeptModalOpen(false);
          loadData();
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to create department.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error processing department action.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete department "${name}"? Employees will be unassigned.`)) {
      return;
    }

    try {
      const res = await api.organization.deleteDepartment(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `Department "${name}" deleted successfully!` });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete department.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error deleting department.' });
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

      {/* Subtabs & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Subtabs Pill */}
        <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8] overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'employees'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'departments'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'roles'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'structure'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Reporting Structure
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="px-4 py-2 rounded-full bg-[#FAF7F2] dark:bg-gray-800 hover:bg-[#F0ECE1] dark:hover:bg-gray-700 text-[#475569] dark:text-gray-200 text-xs font-semibold border border-[#E2E8F0] dark:border-gray-700 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span>Onboarding Hub</span>
          </Link>
          {activeTab === 'departments' ? (
            <button
              onClick={openCreateDeptModal}
              className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Department</span>
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          )}
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
                      : emp.primaryManager
                      ? `${emp.primaryManager.firstName} ${emp.primaryManager.lastName}`
                      : 'None';

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-[#1F2937]">Enterprise Departments ({departments.length})</h2>
            <button
              onClick={openCreateDeptModal}
              className="px-3.5 py-1.5 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Department</span>
            </button>
          </div>

          {departments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#F1ECE4] p-8 text-center shadow-xs">
              <Building2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
              <p className="font-bold text-sm text-[#1F2937]">No departments yet</p>
              <p className="text-xs text-[#8A92A6] mt-1 mb-4">
                Structure your company into departments to manage heads, teams, and budget.
              </p>
              <button
                onClick={openCreateDeptModal}
                className="px-4 py-2 rounded-full bg-[#FF8A00] text-white text-xs font-semibold shadow-xs"
              >
                + Create Department
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const memberCount = dept._count?.employees ?? (dept.employees?.length || 0);
                const headName = dept.head
                  ? `${dept.head.firstName} ${dept.head.lastName}`
                  : 'Unassigned';

                return (
                  <div
                    key={dept.id}
                    className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs flex flex-col justify-between hover:border-[#FFD7B0] transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF7A00] font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#1F2937] leading-tight">{dept.name}</h3>
                            <span className="text-[10px] font-semibold text-[#8A92A6] uppercase tracking-wider">
                              Code: {dept.code}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#FFF0E0] text-[#D96B00] font-bold text-[10px] border border-[#FED7AA]">
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                      {dept.description && (
                        <p className="text-xs text-[#64748B] mb-3 line-clamp-2 leading-relaxed">
                          {dept.description}
                        </p>
                      )}

                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#F1EAE0] flex items-center justify-between text-xs mb-3">
                        <span className="text-[#8A92A6] text-[11px] font-medium">Head of Department:</span>
                        <span className="font-semibold text-[#1F2937] text-xs truncate max-w-[140px]">
                          {headName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F5F2EB]">
                      <button
                        onClick={() => openEditDeptModal(dept)}
                        className="px-3 py-1.5 rounded-xl border border-[#E2DDD5] text-xs font-semibold text-[#475569] hover:bg-[#FAF7F2] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                        className="px-3 py-1.5 rounded-xl border border-[#FECACA] text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            <div className="text-center py-10 text-[#8A92A6] text-xs">
              <Network className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
              <p className="font-semibold text-sm text-[#1F2937] mb-1">Single Administrator Workspace</p>
              <p className="text-xs">Reporting hierarchy and tree nodes will automatically render as employees and managers are added.</p>
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

      {/* Create / Edit Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF7A00]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F2937]">
                    {editingDept ? 'Edit Department' : 'Create Department'}
                  </h3>
                  <p className="text-[11px] text-[#8A92A6]">
                    Configure organizational department and leadership.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              {!editingDept && (
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ENG, FIN, MKT"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00] uppercase"
                  />
                  <span className="text-[10px] text-[#8A92A6] mt-0.5 block">Unique uppercase identifier for this department.</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of department responsibilities and mission..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Head of Department (Lead)</label>
                <select
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                >
                  <option value="">None / Assign Later</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#8A92A6] mt-0.5 block">Assigning a head grants DEPARTMENT_HEAD permissions.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
