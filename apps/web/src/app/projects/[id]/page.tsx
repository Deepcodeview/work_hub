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
  CheckSquare,
} from '../../../components/icons';
import { api } from '../../../lib/api';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
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
      if (tasksRes.success && Array.isArray(tasksRes.data)) {
        setTasks(
          tasksRes.data.map((t: any) => ({
            ...t,
            status: t.status === 'COMPLETED' ? 'DONE' : t.status,
          }))
        );
      } else {
        setTasks([]);
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
        projectId: project?.id || projectId,
        taskCode,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority as any,
        estimatedMinutes: Number(taskForm.estimatedMinutes),
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Task created and saved to database!' });
        setShowTaskModal(false);
        setTaskForm({ taskCode: '', title: '', description: '', priority: 'MEDIUM', estimatedMinutes: 60 });
        fetchProjectAndTasks();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create task.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating task.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const backendStatus = newStatus === 'DONE' ? 'COMPLETED' : newStatus;
    try {
      await api.tasks.update(taskId, { status: backendStatus as any });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch {
      // handled
    }
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
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

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-2 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#FAF7F2] text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FF7A00] bg-[#FFF2E5] px-2.5 py-0.5 rounded-md">
                {project?.code || 'PROJECT'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
                {project?.name || 'Project Details'}
              </h1>
            </div>
            <p className="text-xs text-[#8A92A6] mt-0.5 max-w-xl">
              {project?.description || 'Active project task sprint board'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-semibold rounded-full shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Progress Metric Card */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <span className="text-xs font-bold text-[#8A92A6] uppercase tracking-wider block mb-1">
            Project Sprint Completion
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1F2937]">{progressPercent}%</span>
            <span className="text-xs text-[#64748B]">
              ({doneTasks.length} of {totalTasks} tasks completed)
            </span>
          </div>
        </div>

        <div className="w-full sm:w-72 h-3 bg-[#F1ECE4] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FFB366] to-[#FF7A00] rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progressPercent, totalTasks > 0 ? 5 : 0)}%` }}
          />
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: TODO */}
        <div className="bg-[#FAF7F2]/60 rounded-3xl p-4 border border-[#F1ECE4]">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span>
              <h3 className="font-bold text-sm text-[#1F2937]">To Do</h3>
              <span className="text-xs font-bold text-[#64748B] bg-white px-2 py-0.5 rounded-full border border-[#E2DDD5]">
                {todoTasks.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {todoTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#94A3B8]">No tasks to do</div>
            ) : (
              todoTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-2xl border border-[#F1ECE4] shadow-xs hover:border-[#FFCCA0] transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#FF7A00] bg-[#FFF2E5] px-2 py-0.5 rounded-md">
                      {task.taskCode || 'TSK'}
                    </span>
                    <button
                      onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                      className="text-[10px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded-full hover:bg-[#DBEAFE] transition-colors"
                    >
                      Start →
                    </button>
                  </div>
                  <h4 className="font-semibold text-sm text-[#1F2937] mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-[#8A92A6] mb-3 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F8F5F0]">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#64748B]">
                      {task.priority || 'MEDIUM'}
                    </span>
                    <span className="text-[10px] text-[#8A92A6]">
                      {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '60m'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: IN_PROGRESS */}
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
            {inProgressTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#94A3B8]">No tasks in progress</div>
            ) : (
              inProgressTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-2xl border border-[#F1ECE4] shadow-xs hover:border-[#3B82F6]/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded-md">
                      {task.taskCode || 'TSK'}
                    </span>
                    <button
                      onClick={() => handleStatusChange(task.id, 'DONE')}
                      className="text-[10px] font-bold text-[#10B981] bg-[#F0FDF4] px-2 py-0.5 rounded-full hover:bg-[#DCFCE7] transition-colors"
                    >
                      Done ✓
                    </button>
                  </div>
                  <h4 className="font-semibold text-sm text-[#1F2937] mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-[#8A92A6] mb-3 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F8F5F0]">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6]">
                      {task.priority || 'MEDIUM'}
                    </span>
                    <span className="text-[10px] text-[#8A92A6]">
                      {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '60m'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: DONE */}
        <div className="bg-[#FAF7F2]/60 rounded-3xl p-4 border border-[#F1ECE4]">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <h3 className="font-bold text-sm text-[#1F2937]">Done</h3>
              <span className="text-xs font-bold text-[#10B981] bg-white px-2 py-0.5 rounded-full border border-[#E2DDD5]">
                {doneTasks.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {doneTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#94A3B8]">No completed tasks yet</div>
            ) : (
              doneTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-2xl border border-[#F1ECE4] shadow-xs opacity-90 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-md">
                      {task.taskCode || 'TSK'}
                    </span>
                    <span className="text-[10px] font-bold text-[#10B981] bg-[#F0FDF4] px-2 py-0.5 rounded-full">
                      ✓ Done
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm line-through text-[#64748B] mb-1">
                    {task.title}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F8F5F0]">
                    <span className="text-[10px] text-[#94A3B8]">Completed</span>
                    <button
                      onClick={() => handleStatusChange(task.id, 'TODO')}
                      className="text-[10px] text-[#64748B] hover:text-[#1F2937]"
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
              <h2 className="text-base font-bold text-[#1F2937]">Create Project Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement user authentication"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Task Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CORE-101"
                  value={taskForm.taskCode}
                  onChange={(e) => setTaskForm({ ...taskForm, taskCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Task details and scope..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    value={taskForm.estimatedMinutes}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-semibold shadow-xs"
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
