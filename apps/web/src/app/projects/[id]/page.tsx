'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FolderKanban,
  Kanban,
  List,
  Calendar,
  Plus,
  ArrowLeft,
  Clock,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  X,
} from '../../../components/icons';
import { api } from '../../../lib/api';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>({
    id: projectId || 'hrms-platform',
    name: 'HRMS Platform',
    code: 'CORE',
    description: 'Human resource management system, leave approval, and payroll processing',
    progress: 68,
  });

  const [tasks, setTasks] = useState<any[]>([
    {
      id: 'task-1',
      taskCode: 'CORE-101',
      title: 'Setup project structure',
      description: 'Setup monorepo configuration with Turborepo and pnpm',
      status: 'TODO',
      priority: 'HIGH',
      estimatedMinutes: 120,
    },
    {
      id: 'task-2',
      taskCode: 'CORE-102',
      title: 'Design new UI components',
      description: 'Create reusable Card, Badge, Input, and Modal primitives',
      status: 'TODO',
      priority: 'MEDIUM',
      estimatedMinutes: 180,
    },
    {
      id: 'task-3',
      taskCode: 'CORE-103',
      title: 'Implement attendance API',
      description: 'Build single-session clock in/out with GPS capture',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedMinutes: 240,
    },
    {
      id: 'task-4',
      taskCode: 'CORE-104',
      title: 'Integrate timesheet module',
      description: 'Weekly work logging and strict manager approval rules',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedMinutes: 180,
    },
    {
      id: 'task-5',
      taskCode: 'CORE-105',
      title: 'Project kickoff',
      description: 'Initial architectural scope and team alignment',
      status: 'DONE',
      priority: 'HIGH',
      estimatedMinutes: 60,
    },
    {
      id: 'task-6',
      taskCode: 'CORE-106',
      title: 'Wireframes',
      description: 'Complete UI layout design based on modern Figma specs',
      status: 'DONE',
      priority: 'MEDIUM',
      estimatedMinutes: 120,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [taskForm, setTaskForm] = useState({
    taskCode: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    estimatedMinutes: 60,
  });

  const fetchProjectAndTasks = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const projRes = await api.projects.get(projectId);
      if (projRes.success && projRes.data) {
        setProject(projRes.data);
      }

      const tasksRes = await api.tasks.listByProject(projectId);
      if (tasksRes.success && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
        setTasks(
          tasksRes.data.map((t: any) => ({
            ...t,
            status: t.status === 'COMPLETED' ? 'DONE' : t.status,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching project tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskCode = taskForm.taskCode.trim().toUpperCase() || `TSK-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await api.tasks.create({
        projectId: project.id || projectId,
        taskCode,
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        estimatedMinutes: Number(taskForm.estimatedMinutes),
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Task created successfully!' });
        setShowTaskModal(false);
        setTaskForm({ taskCode: '', title: '', description: '', priority: 'MEDIUM', estimatedMinutes: 60 });
        fetchProjectAndTasks();
        return;
      }
    } catch (err) {
      console.error('Failed to create task via API, adding locally:', err);
    }

    const newTask = {
      id: `task-${Date.now()}`,
      taskCode,
      title: taskForm.title,
      description: taskForm.description,
      status: 'TODO',
      priority: taskForm.priority,
      estimatedMinutes: Number(taskForm.estimatedMinutes),
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowTaskModal(false);
    setTaskForm({ taskCode: '', title: '', description: '', priority: 'MEDIUM', estimatedMinutes: 60 });
    setFeedback({ type: 'success', message: 'Task added to board!' });
    setTimeout(() => setFeedback(null), 3500);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    if (!taskId.startsWith('task-')) {
      try {
        const backendStatus = newStatus === 'DONE' ? 'COMPLETED' : newStatus;
        await api.tasks.update(taskId, { status: backendStatus });
      } catch (err) {
        console.error('Error updating status on server:', err);
      }
    }

    setFeedback({ type: 'success', message: `Status updated to ${newStatus}` });
    setTimeout(() => setFeedback(null), 2500);
  };

  const columns = [
    { key: 'TODO', label: 'To Do', color: '#94A3B8' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
    { key: 'DONE', label: 'Done', color: '#10B981' },
  ];

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

      {/* Header with Back Link & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-2 rounded-xl bg-white border border-[#E2DDD5] text-[#64748B] hover:text-[#1F2937] hover:bg-[#FAF7F2] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
              <span>{project.name}</span>
              {project.code && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF3E8] text-[#FF8A00]">
                  {project.code}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-[#8A92A6]">{project.description}</p>
          </div>
        </div>

        <button
          onClick={() => setShowTaskModal(true)}
          className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);

          return (
            <div
              key={col.key}
              className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#F1ECE4] flex flex-col min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.color }}
                  ></span>
                  <h2 className="font-bold text-sm text-[#1F2937]">{col.label}</h2>
                  <span className="text-xs font-bold text-[#8A92A6] bg-white px-2 py-0.5 rounded-full border border-[#E2DDD5]">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="text-[#8A92A6] hover:text-[#1F2937]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 flex-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-2xl border border-[#F1ECE4] shadow-xs hover:border-[#FFCCA0] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-[#8A92A6]">
                        {task.taskCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          task.priority === 'HIGH'
                            ? 'bg-[#FEF2F2] text-[#EF4444]'
                            : task.priority === 'MEDIUM'
                            ? 'bg-[#FFFBEB] text-[#D97706]'
                            : 'bg-[#F0FDF4] text-[#16A34A]'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-[#1F2937] group-hover:text-[#FF7A00] transition-colors mb-2">
                      {task.title}
                    </h3>
                    <p className="text-xs text-[#8A92A6] mb-3 line-clamp-2">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F8F5F0]">
                      <div className="flex items-center gap-1 text-[11px] text-[#8A92A6]">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedMinutes || 60}m</span>
                      </div>

                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="text-[11px] font-semibold bg-[#FAF7F2] border border-[#E2DDD5] rounded-md px-1.5 py-0.5 text-[#334155] outline-none"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#F1ECE4] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3 mb-4">
              <h2 className="font-bold text-base text-[#1F2937]">Create New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#8A92A6] block mb-1">
                  Task Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CORE-107"
                  value={taskForm.taskCode}
                  onChange={(e) => setTaskForm({ ...taskForm, taskCode: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-sm text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8A92A6] block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-sm text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8A92A6] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed task description..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-sm text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8A92A6] block mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-sm text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8A92A6] block mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={taskForm.estimatedMinutes}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-sm text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
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
