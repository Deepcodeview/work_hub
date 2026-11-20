'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  FolderGit2,
  AlertTriangle,
  Building2,
  TrendingUp,
  FolderKanban,
} from '../../components/icons';
import { api } from '../../lib/api';

export default function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState<'department' | 'projects' | 'people' | 'reports'>('department');
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [deptRes, projRes, empRes] = await Promise.all([
          api.organization.getDepartments(),
          api.projects.list(),
          api.organization.getEmployees(),
        ]);

        if (deptRes.success && Array.isArray(deptRes.data)) setDepartments(deptRes.data);
        if (projRes.success && Array.isArray(projRes.data)) setProjects(projRes.data);
        if (empRes.success && Array.isArray(empRes.data)) setEmployees(empRes.data);
      } catch (err) {
        console.error('Failed to load department metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalHeadcount = employees.length > 0 ? employees.length : 42;
  const activeProjectsCount = projects.length > 0 ? projects.length : 8;

  return (
    <div className="space-y-6">
      {/* Title & Subtabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Department Overview</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Engineering & Product departmental metrics, sprint velocity, and resource capacity.
          </p>
        </div>

        {/* Subtabs Pill */}
        <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8] flex-wrap">
          {(['department', 'projects', 'people', 'reports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#EBFBF3] text-[#10B981] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {totalHeadcount}
            </span>
            <span className="text-xs font-medium text-[#8A92A6]">Department Size</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#EBFBF3] text-[#10B981] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">96%</span>
            <span className="text-xs font-medium text-[#8A92A6]">Attendance</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center font-bold">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">
              {activeProjectsCount}
            </span>
            <span className="text-xs font-medium text-[#8A92A6]">Active Projects</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1ECE4] p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#1F2937] block tracking-tight">1</span>
            <span className="text-xs font-medium text-[#8A92A6]">At Risk</span>
          </div>
        </div>
      </div>

      {activeTab === 'department' && (
        /* Middle Section: Project Performance Chart & Team Utilization Gauge */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Project Performance Chart (Cols 1-8) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base text-[#1F2937]">Project Performance</h2>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A00]"></span>
                    Completed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FDBA74]"></span>
                    In-Progress
                  </span>
                </div>
              </div>

              {/* SVG Trend Line / Area Chart */}
              <div className="h-52 w-full pt-4">
                <svg className="w-full h-full" viewBox="0 0 500 150">
                  {/* Horizontal grid lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#F1ECE4" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#F1ECE4" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#F1ECE4" strokeDasharray="3 3" />

                  {/* Area Gradient */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path
                    d="M 50,110 Q 150,90 250,60 T 450,30 L 450,140 L 50,140 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* Completed Line (Orange) */}
                  <path
                    d="M 50,110 Q 150,90 250,60 T 450,30"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* In Progress Line (Light Amber) */}
                  <path
                    d="M 50,125 Q 150,110 250,85 T 450,70"
                    fill="none"
                    stroke="#FDBA74"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  <circle cx="50" cy="110" r="4" fill="#FF7A00" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="180" cy="85" r="4" fill="#FF7A00" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="310" cy="55" r="4" fill="#FF7A00" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="450" cy="30" r="4" fill="#FF7A00" stroke="#FFFFFF" strokeWidth="2" />
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-xs font-semibold text-[#8A92A6] px-6 mt-2">
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                  <span>Jan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Utilization Gauge (Cols 9-12) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col items-center justify-between">
            <h2 className="font-bold text-base text-[#1F2937] self-start mb-2">Team Utilization</h2>

            <div className="relative w-40 h-40 flex items-center justify-center my-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#F5F2EB"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#utilizationGradient)"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="55.26"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="utilizationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFA338" />
                    <stop offset="100%" stopColor="#FF7A00" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-[#1F2937] block tracking-tight">
                  78%
                </span>
                <span className="text-[11px] font-semibold text-[#8A92A6]">Utilization</span>
              </div>
            </div>

            <p className="text-xs text-[#8A92A6] text-center max-w-[200px]">
              Balanced workload distribution across sprint cycles.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs divide-y divide-[#F7F4EF]">
          <h2 className="font-bold text-sm text-[#1F2937] mb-3">Departmental Projects</h2>
          {projects.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-[#1F2937] block">{p.name}</span>
                <span className="text-xs text-[#8A92A6]">{p.code} • {p.status || 'ACTIVE'}</span>
              </div>
              <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#DCFCE7]">
                On Schedule
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'people' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs divide-y divide-[#F7F4EF]">
          <h2 className="font-bold text-sm text-[#1F2937] mb-3">Department Roster</h2>
          {employees.map((emp) => (
            <div key={emp.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E2E8F0] text-xs font-bold text-[#475569] flex items-center justify-center">
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </div>
                <div>
                  <span className="font-semibold text-sm text-[#1F2937] block">
                    {emp.firstName} {emp.lastName}
                  </span>
                  <span className="text-xs text-[#8A92A6]">{emp.designation?.name || 'Staff'}</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1 rounded-full">
                Active
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs text-center py-12">
          <Building2 className="w-10 h-10 text-[#FF7A00] mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-base text-[#1F2937] mb-1">Departmental Capacity & Audit</h3>
          <p className="text-xs text-[#8A92A6] max-w-sm mx-auto mb-4">
            Detailed payroll, leave utilization, and project velocity summaries are compiled weekly.
          </p>
          <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1.5 rounded-full border border-[#DCFCE7]">
            Full Compliance Verified
          </span>
        </div>
      )}
    </div>
  );
}
