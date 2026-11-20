'use client';

import React, { useState, useEffect } from 'react';
import {
  List,
  Kanban,
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  X,
} from '../../components/icons';
import { api } from '../../lib/api';

interface TaskItem {
  id: string;
  taskCode?: string;
  title: string;
  project: string;
  projectId?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
}

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('board');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New task form fields
  const [newTitle, setNewTitle] = useState('');
  const [newTaskCode, setNewTaskCode] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState('120');

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const projRes = await api.projects.list();
      if (projRes.success && Array.isArray(projRes.data) && projRes.data.length > 0) {
        setProjectsList(projRes.data);
        if (!newProject) setNewProject(projRes.data[0].id);

        // Fetch tasks for the projects
        let collectedTasks: TaskItem[] = [];
        for (const p of projRes.data) {
          const tRes = await api.tasks.listByProject(p.id);
          if (tRes.success && Array.isArray(tRes.data)) {
            const mapped = tRes.data.map((t: any) => ({
              id: t.id,
              taskCode: t.taskCode,
              title: t.title,
              project: p.name,
              projectId: p.id,
              status: (t.status === 'COMPLETED' ? 'DONE' : t.status) as any,
              assignee: t.assignees?.[0]?.employee?.firstName?.[0] || 'A',
              priority: (t.priority || 'MEDIUM') as any,
              dueDate: t.dueDate,
            }));
            collectedTasks = [...collectedTasks, ...mapped];
          }
        }

        setTasks(collectedTasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Call live backend if not mock ID
    if (!taskId.startsWith('task-')) {
      try {
        const backendStatus = newStatus === 'DONE' ? 'COMPLETED' : newStatus;
        await api.tasks.update(taskId, { status: backendStatus });
      } catch (err) {
        console.error('Failed to update status on server:', err);
      }
    }

    setFeedback({ type: 'success', message: `Task moved to ${newStatus.replace('_', ' ')}` });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFeedback({ type: 'error', message: 'Task title is required.' });
      return;
    }

    const targetProjectId = newProject || projectsList[0]?.id;
    const generatedCode = newTaskCode.trim() || `TSK-${Math.floor(100 + Math.random() * 900)}`;

    if (targetProjectId) {
      try {
        const res = await api.tasks.create({
          projectId: targetProjectId,
          taskCode: generatedCode.toUpperCase(),
          title: newTitle,
          priority: newPriority,
          estimatedMinutes: parseInt(newEstimatedMinutes, 10) || 120,
        });

        if (res.success) {
          setFeedback({ type: 'success', message: 'Task created successfully!' });
          setIsModalOpen(false);
          setNewTitle('');
          setNewTaskCode('');
          fetchTasksData();
          return;
        }
      } catch (err) {
        console.error('API create task failed, adding locally:', err);
      }
    }

    // Local fallback
    const localNewTask: TaskItem = {
      id: `task-${Date.now()}`,
      taskCode: generatedCode.toUpperCase(),
      title: newTitle,
      project: projectsList.find((p) => p.id === targetProjectId)?.name || 'HRMS Platform',
      status: 'TODO',
      assignee: 'JC',
      priority: newPriority,
    };

    setTasks((prev) => [localNewTask, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewTaskCode('');
    setFeedback({ type: 'success', message: 'Task added to board!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredTasks =
    selectedProjectId === 'all'
      ? tasks
      : tasks.filter((t) => t.projectId === selectedProjectId);

  const todoTasks = filteredTasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = filteredTasks.filter((t) => t.status === 'DONE');

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

      {/* Controls & View Switcher */}
      <div className="flex justify-end items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project Filter */}
          {projectsList.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-semibold text-[#1F2937] outline-none"
            >
              <option value="all">All Projects</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* View Switcher Pill */}
          <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'board'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Board View matching exact design */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: To Do */}
          <div className="bg-[#FAF7F2]/60 rounded-3xl p-4 border border-[#F1ECE4]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span>
                <h3 className="font-bold text-sm text-[#1F2937]">To Do</h3>
                <span className="text-xs font-bold text-[#8A92A6] bg-white px-2 py-0.5 rounded-full border border-[#E2DDD5]">
                  {todoTasks.length}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1 hover:bg-white rounded-lg text-[#8A92A6] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {todoTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-2xl border border-[#F1ECE4] shadow-xs hover:border-[#FF8A00]/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#8A92A6]">
                      {task.taskCode || task.project}
                    </span>
                    <button
                      onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                      title="Move to In Progress"
                      className="text-[10px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors"
                    >
                      Start →
                    </button>
                  </div>
                  <h4 className="font-semibold text-sm text-[#1F2937] mb-3 leading-snug">
                    {task.title}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F8F5F0]">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        task.priority === 'HIGH'
                          ? 'bg-[#FEF2F2] text-[#DC2626]'
                          : task.priority === 'MEDIUM'
                          ? 'bg-[#FFFBEB] text-[#D97706]'
                          : 'bg-[#F0FDF4] text-[#16A34A]'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#F5F2EB] border border-white text-[10px] font-bold text-[#475569] flex items-center justify-center">
                      {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-[#FAF7F2]/60 rounded-3xl p-4 border border-[#F1ECE4]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                <h3 className="font-bold text-sm text-[#1F2937]">In Progress</h3>
                <span className="text-xs font-bold text-[#3B82F6] bg-white px-2 py-0.5 rounded-full border border-[#E2DDD5]">
                  {inProgressTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-2xl border border-[#F1ECE4] shadow-xs hover:border-[#3B82F6]/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#8A92A6]">
                      {task.taskCode || task.project}
                    </span>
                    <button
                      onClick={() => handleStatusChange(task.id, 'DONE')}
                      title="Mark as Complete"
                      className="text-[10px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0] hover:bg-[#DCFCE7] transition-colors"
                    >
                      Complete ✓
                    </button>
                  </div>
                  <h4 className="font-semibold text-sm text-[#1F2937] mb-3 leading-snug">
                    {task.title}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F8F5F0]">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        task.priority === 'HIGH'
                          ? 'bg-[#FEF2F2] text-[#DC2626]'
                          : task.priority === 'MEDIUM'
                          ? 'bg-[#FFFBEB] text-[#D97706]'
                          : 'bg-[#F0FDF4] text-[#16A34A]'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#EFF6FF] border border-white text-[10px] font-bold text-[#1D4ED8] flex items-center justify-center">
                      {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="bg-[#FAF7F2]/60 rounded-3xl p-4 border border-[#F1ECE4]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                <h3 className="font-bold text-sm text-[#1F2937]">Done</h3>
                <span className="text-xs font-bold text-[#16A34A] bg-white px-2 py-0.5 rounded-full border border-[#E2DDD5]">
                  {doneTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {doneTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-2xl border border-[#F1ECE4] shadow-xs opacity-90 hover:opacity-100 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#8A92A6]">
                      {task.taskCode || task.project}
                    </span>
                    <span className="text-[10px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                      ✓ Done
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-[#1F2937] mb-3 leading-snug line-through text-[#94A3B8]">
                    {task.title}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F8F5F0]">
                    <span className="text-[10px] font-bold text-[#8A92A6] bg-[#F5F2EB] px-2 py-0.5 rounded-full">
                      Resolved
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#F0FDF4] border border-white text-[10px] font-bold text-[#15803D] flex items-center justify-center">
                      {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs divide-y divide-[#F7F4EF]">
          {filteredTasks.map((task) => (
            <div key={task.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    handleStatusChange(
                      task.id,
                      task.status === 'DONE' ? 'TODO' : 'DONE'
                    )
                  }
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    task.status === 'DONE'
                      ? 'bg-[#16A34A] border-[#16A34A] text-white'
                      : 'border-[#CBD5E1] hover:border-[#FF8A00]'
                  }`}
                >
                  {task.status === 'DONE' && '✓'}
                </button>
                <div>
                  <span
                    className={`font-semibold text-sm ${
                      task.status === 'DONE' ? 'line-through text-[#94A3B8]' : 'text-[#1F2937]'
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="text-xs text-[#8A92A6] block">{task.project}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    task.status === 'DONE'
                      ? 'bg-[#F0FDF4] text-[#16A34A]'
                      : task.status === 'IN_PROGRESS'
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'bg-[#FFFBEB] text-[#D97706]'
                  }`}
                >
                  {task.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-[#64748B] font-bold w-6 h-6 rounded-full bg-[#FAF7F2] flex items-center justify-center border border-[#E2DDD5]">
                  {task.assignee}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs text-center py-12">
          <Calendar className="w-10 h-10 text-[#FF8A00] mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-base text-[#1F2937] mb-1">Sprint Schedule & Milestones</h3>
          <p className="text-xs text-[#8A92A6] max-w-sm mx-auto mb-4">
            Tasks with due dates are scheduled automatically into the engineering release calendar.
          </p>
          <div className="inline-flex gap-2">
            <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1.5 rounded-full border border-[#DCFCE7]">
              Current Sprint Ends Mar 31
            </span>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
              <h2 className="text-base font-bold text-[#1F2937]">Create New Task</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Project</label>
                <select
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                >
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Design responsive invoice template"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Task Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CORE-107"
                    value={newTaskCode}
                    onChange={(e) => setNewTaskCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
