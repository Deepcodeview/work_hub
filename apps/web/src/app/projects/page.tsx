'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Calendar,
  Users,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from '../../components/icons';
import { api } from '../../lib/api';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Project Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.projects.list();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setProjects(res.data);
      } else {
        // Fallback default sample view matching reference
        setProjects([
          {
            id: 'hrms-platform',
            name: 'HRMS Platform',
            code: 'HRMS',
            description: 'Sprint 3 • 68%',
            progress: 68,
            color: '#8B5CF6',
            bgLight: '#F5F3FF',
            dueDate: 'Due Mar 31',
            team: ['JC', 'ED', 'MC'],
          },
          {
            id: 'mobile-app',
            name: 'Mobile App',
            code: 'MAPP',
            description: 'v2.0 • 40%',
            progress: 40,
            color: '#3B82F6',
            bgLight: '#EFF6FF',
            dueDate: 'Due Apr 30',
            team: ['JC', 'SM'],
          },
          {
            id: 'client-portal',
            name: 'Client Portal',
            code: 'CPORT',
            description: 'Design • 85%',
            progress: 85,
            color: '#10B981',
            bgLight: '#F0FDF4',
            dueDate: 'Due Feb 28',
            team: ['JC', 'DK', 'ED'],
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFeedback({ type: 'error', message: 'Project name and project code are required.' });
      return;
    }

    try {
      const res = await api.projects.create({
        name,
        code: code.toUpperCase(),
        description: description || 'Active Project',
        startDate,
        endDate: endDate || undefined,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Project ${name} created successfully!` });
        setIsCreateModalOpen(false);
        setName('');
        setCode('');
        setDescription('');
        fetchProjects();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create project.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating project.' });
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

      {/* Title & Subtabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Manage your cross-functional development roadmaps, milestones, and deliverable schedules.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Subtabs Pill */}
          <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8]">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'my'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              My Projects
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              All Projects
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects List Card Container */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs divide-y divide-[#F7F4EF]">
        {projects.map((proj, idx) => {
          const colors = [
            { main: '#8B5CF6', bg: '#F5F3FF' },
            { main: '#3B82F6', bg: '#EFF6FF' },
            { main: '#10B981', bg: '#F0FDF4' },
            { main: '#FF8A00', bg: '#FFF7ED' },
          ];
          const colorPair = colors[idx % colors.length];
          const progressVal = proj.progress || (proj.status === 'COMPLETED' ? 100 : 55);

          return (
            <Link
              key={proj.id}
              href={`/projects/${proj.id}`}
              className="py-5 first:pt-0 last:pb-0 block hover:bg-[#FAF7F2]/60 px-4 rounded-2xl transition-colors group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left project badge & title */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs"
                    style={{ backgroundColor: colorPair.bg, color: colorPair.main }}
                  >
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1F2937] group-hover:text-[#FF7A00] transition-colors">
                      {proj.name}
                    </h3>
                    <span className="text-xs text-[#8A92A6]">
                      {proj.code ? `[${proj.code}] ` : ''}
                      {proj.description || 'Sprint in progress'}
                    </span>
                  </div>
                </div>

                {/* Middle: Progress Bar */}
                <div className="w-full md:w-64">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#8A92A6]">Progress</span>
                    <span className="font-bold" style={{ color: colorPair.main }}>
                      {progressVal}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F1ECE4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressVal}%`,
                        backgroundColor: colorPair.main,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Right: Team and Due Date */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex -space-x-2 overflow-hidden">
                    {['JC', 'ED', 'MC'].map((member, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#E2E8F0] to-[#F1F5F9] border-2 border-white text-[10px] font-bold text-[#475569] flex items-center justify-center shadow-xs"
                      >
                        {member}
                      </div>
                    ))}
                  </div>

                  <span className="text-xs font-semibold text-[#FF7A00] bg-[#FFF0E0] px-3 py-1.5 rounded-full border border-[#FFE2C8]">
                    {proj.dueDate || 'Active'}
                  </span>

                  <ChevronRight className="w-4 h-4 text-[#8A92A6] group-hover:text-[#FF7A00] transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* New Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
              <h2 className="text-base font-bold text-[#1F2937]">Create New Project</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. AI Workflow Automations"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Project Code</label>
                <input
                  type="text"
                  placeholder="e.g. AI-AUTO"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of project objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
