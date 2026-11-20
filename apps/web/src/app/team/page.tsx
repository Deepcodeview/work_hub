'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Mail,
  Building2,
  ChevronRight,
  Plus,
} from '../../components/icons';
import { api } from '../../lib/api';

export default function TeamPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        const [empRes, deptRes] = await Promise.all([
          api.organization.getEmployees(),
          api.organization.getDepartments(),
        ]);
        if (empRes.success && Array.isArray(empRes.data)) {
          setEmployees(empRes.data);
        } else {
          setEmployees([]);
        }
        if (deptRes.success && Array.isArray(deptRes.data)) {
          setDepartments(deptRes.data);
        }
      } catch (err) {
        console.error('Failed to load team:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, []);

  const filtered = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (emp.workEmail && emp.workEmail.toLowerCase().includes(search.toLowerCase()));
    const matchesDept =
      departmentFilter === 'ALL' ||
      emp.department?.name?.toUpperCase() === departmentFilter.toUpperCase();

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Actions & Filter Bar */}
      <div className="flex justify-end items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1.5 rounded-full border border-[#DCFCE7]">
            {filtered.length} Active Collaborators
          </span>
          <a
            href="/organization"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF8A00] hover:bg-[#E67C00] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Team Member
          </a>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-[#F1ECE4] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#FAF7F2] rounded-xl border border-[#E2DDD5] text-xs text-[#8A92A6] w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or email..."
            className="w-full bg-transparent border-none outline-none text-xs text-[#1F2937] placeholder-[#9CA3AF]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Cards Grid / Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0E0] text-[#FF8A00] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#1F2937]">No Team Members Found</h3>
          <p className="text-xs text-[#8A92A6] max-w-sm mx-auto mt-1 mb-5">
            Your workspace is clean. As an Admin, you can add new employees and invite team members to your organization.
          </p>
          <a
            href="/organization"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF8A00] hover:bg-[#E67C00] text-white rounded-full text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Employee in Organization
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((emp) => {
            const initials = `${emp.firstName?.[0] || 'T'}${emp.lastName?.[0] || 'M'}`;
            const colors = ['#FF981A', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];
            const avatarColor =
              emp.avatarBg || colors[Math.abs(emp.firstName.charCodeAt(0)) % colors.length];

            return (
              <div
                key={emp.id}
                className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs hover:border-[#FFCCA0] transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1F2937] leading-tight">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <span className="text-xs text-[#8A92A6] block mt-0.5">
                        {emp.designation?.title || emp.designation?.name || 'Software Engineer'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
                    Active
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#F8F5F0] text-xs">
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>{emp.department?.name || 'Engineering'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span className="truncate">{emp.workEmail || `${emp.firstName.toLowerCase()}@workhub.internal`}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
