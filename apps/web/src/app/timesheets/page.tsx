'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Save,
  Send,
  AlertCircle,
  X,
  Download,
} from '../../components/icons';
import { api } from '../../lib/api';

interface TimesheetRow {
  id: string;
  projectId: string;
  project: string;
  category: string;
  color: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
}

export default function TimesheetsPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [submitted, setSubmitted] = useState(false);
  const [currentTimesheetId, setCurrentTimesheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [teamSubmissions, setTeamSubmissions] = useState<any[]>([]);

  // Form state for new entry
  const [newEntryProject, setNewEntryProject] = useState('');
  const [newEntryTask, setNewEntryTask] = useState('');
  const [newEntryHours, setNewEntryHours] = useState('4.0');

  // Table rows initialized cleanly from backend or user entry
  const [rows, setRows] = useState<TimesheetRow[]>([]);

  // Load live data on mount
  useEffect(() => {
    async function initTimesheets() {
      try {
        setLoading(true);
        // Load projects
        const projRes = await api.projects.list();
        if (projRes.success && Array.isArray(projRes.data) && projRes.data.length > 0) {
          setProjectsList(projRes.data);
          setNewEntryProject(projRes.data[0].id);
        }

        // Load today's timesheet from backend
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyRes = await api.timesheets.getDaily(todayStr);
        if (dailyRes.success && dailyRes.data) {
          setCurrentTimesheetId(dailyRes.data.id || null);
          if (dailyRes.data.status === 'SUBMITTED' || dailyRes.data.status === 'APPROVED') {
            setSubmitted(true);
          }
        }

        // Load team approvals
        const teamRes = await api.timesheets.getPendingApprovals();
        if (teamRes.success && Array.isArray(teamRes.data)) {
          setTeamSubmissions(teamRes.data);
        }
      } catch (err) {
        console.error('Failed to initialize timesheet:', err);
      } finally {
        setLoading(false);
      }
    }

    initTimesheets();
  }, []);

  const handleCellChange = (rowId: string, day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri', val: string) => {
    const num = parseFloat(val) || 0;
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [day]: Math.max(0, Math.min(24, num)) } : r))
    );
  };

  const handleSaveDraft = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const entries = rows.map((r) => ({
        projectId: r.projectId.startsWith('proj-') && projectsList[0]?.id ? projectsList[0].id : r.projectId,
        durationMinutes: Math.round(r.mon * 60),
        taskSummary: `${r.project} - ${r.category}`,
      }));

      const res = await api.timesheets.logDaily({
        workDate: todayStr,
        entries,
      });

      if (res.success) {
        if (res.data?.id) setCurrentTimesheetId(res.data.id);
        setFeedback({ type: 'success', message: 'Timesheet draft saved successfully!' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to save draft' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving draft' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmitTimesheet = async () => {
    try {
      if (currentTimesheetId) {
        const res = await api.timesheets.submit(currentTimesheetId);
        if (res.success) {
          setSubmitted(true);
          setFeedback({ type: 'success', message: 'Timesheet submitted for manager approval!' });
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to submit timesheet' });
        }
      } else {
        // First save draft then submit
        const todayStr = new Date().toISOString().split('T')[0];
        const draftRes = await api.timesheets.logDaily({
          workDate: todayStr,
          entries: rows.map((r) => ({
            projectId: projectsList[0]?.id || r.projectId,
            durationMinutes: Math.round(r.mon * 60),
            taskSummary: `${r.project} - ${r.category}`,
          })),
        });

        if (draftRes.success && draftRes.data?.id) {
          setCurrentTimesheetId(draftRes.data.id);
          const subRes = await api.timesheets.submit(draftRes.data.id);
          if (subRes.success) {
            setSubmitted(true);
            setFeedback({ type: 'success', message: 'Timesheet submitted for manager approval!' });
          } else {
            setFeedback({ type: 'error', message: subRes.error || 'Failed to submit' });
          }
        } else {
          setFeedback({ type: 'error', message: draftRes.error || 'Failed to initialize timesheet' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Submission error' });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleExportTimesheetCSV = () => {
    const headers = ['Project', 'Category', 'Mon (hrs)', 'Tue (hrs)', 'Wed (hrs)', 'Thu (hrs)', 'Fri (hrs)', 'Total (hrs)'];
    const dataRows = rows.map((r) => [
      `"${r.project}"`,
      `"${r.category}"`,
      r.mon,
      r.tue,
      r.wed,
      r.thu,
      r.fri,
      (r.mon + r.tue + r.wed + r.thu + r.fri).toFixed(1),
    ]);

    if (dataRows.length === 0) {
      dataRows.push(['"Internal Operations"', '"Standard Shift"', 8, 8, 8, 8, 8, '40.0']);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...dataRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workhub_timesheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddEntry = () => {
    const selectedProj = projectsList.find((p) => p.id === newEntryProject);
    const hours = parseFloat(newEntryHours) || 2.0;

    const newRow: TimesheetRow = {
      id: `row-${Date.now()}`,
      projectId: newEntryProject || 'proj-custom',
      project: selectedProj?.name || 'Custom Project',
      category: newEntryTask || 'General Task',
      color: ['#F59E0B', '#EC4899', '#6366F1', '#14B8A6'][rows.length % 4],
      mon: hours,
      tue: hours,
      wed: hours,
      thu: hours,
      fri: hours,
    };

    setRows((prev) => [...prev, newRow]);
    setIsAddModalOpen(false);
    setNewEntryTask('');
    setFeedback({ type: 'success', message: 'Entry added to weekly timesheet!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const calcRowTotal = (r: TimesheetRow) => r.mon + r.tue + r.wed + r.thu + r.fri;

  const monTotal = rows.reduce((acc, r) => acc + (r.mon || 0), 0);
  const tueTotal = rows.reduce((acc, r) => acc + (r.tue || 0), 0);
  const wedTotal = rows.reduce((acc, r) => acc + (r.wed || 0), 0);
  const thuTotal = rows.reduce((acc, r) => acc + (r.thu || 0), 0);
  const friTotal = rows.reduce((acc, r) => acc + (r.fri || 0), 0);
  const grandTotal = monTotal + tueTotal + wedTotal + thuTotal + friTotal;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top duration-200 ${
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
      <div className="flex justify-end items-center gap-4">
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
              My Timesheet
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'team'
                  ? 'bg-white text-[#FF7A00] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              Team Timesheet {teamSubmissions.length > 0 && `(${teamSubmissions.length})`}
            </button>
          </div>

          {/* Add Entry Button */}
          {activeTab === 'my' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'my' ? (
        <>
          {/* Date Range Navigation Bar */}
          <div className="bg-white rounded-2xl border border-[#F1ECE4] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button className="p-1.5 rounded-lg border border-[#E2DDD5] hover:bg-[#F8F5F0] text-[#64748B] transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 font-bold text-sm text-[#1F2937]">
                <Calendar className="w-4 h-4 text-[#FF8A00]" />
                <span>Jan 20 – Jan 26, 2025</span>
              </div>
              <button className="p-1.5 rounded-lg border border-[#E2DDD5] hover:bg-[#F8F5F0] text-[#64748B] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select className="px-3 py-1.5 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none">
                <option>Weekly View</option>
                <option>Monthly View</option>
              </select>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  submitted
                    ? 'text-[#16A34A] bg-[#F0FDF4] border-[#DCFCE7]'
                    : 'text-[#D97706] bg-[#FFFBEB] border-[#FEF3C7]'
                }`}
              >
                Status: {submitted ? 'Submitted' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Timesheet Weekly Grid Table */}
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#F1ECE4] text-xs font-semibold text-[#8A92A6]">
                    <th className="pb-3 w-1/3">Project / Task</th>
                    <th className="pb-3 text-center w-20">Mon</th>
                    <th className="pb-3 text-center w-20">Tue</th>
                    <th className="pb-3 text-center w-20">Wed</th>
                    <th className="pb-3 text-center w-20">Thu</th>
                    <th className="pb-3 text-center w-20">Fri</th>
                    <th className="pb-3 text-right pr-4 w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F4EF]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#8A92A6]">
                        <Clock className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#1F2937] mb-1">No Timesheet Entries Yet</p>
                        <p className="text-xs mb-3">Click "+ Add Entry" to record your project hours for this period.</p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          ></div>
                          <div>
                            <span className="font-semibold text-sm text-[#1F2937] block">
                              {row.project}
                            </span>
                            <span className="text-xs text-[#8A92A6] block">{row.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          disabled={submitted}
                          value={row.mon}
                          onChange={(e) => handleCellChange(row.id, 'mon', e.target.value)}
                          className="w-14 text-center font-medium text-[#334155] bg-transparent hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-[#E2DDD5] focus:border-[#FF8A00] outline-none py-1 transition-all"
                        />
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          disabled={submitted}
                          value={row.tue}
                          onChange={(e) => handleCellChange(row.id, 'tue', e.target.value)}
                          className="w-14 text-center font-medium text-[#334155] bg-transparent hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-[#E2DDD5] focus:border-[#FF8A00] outline-none py-1 transition-all"
                        />
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          disabled={submitted}
                          value={row.wed}
                          onChange={(e) => handleCellChange(row.id, 'wed', e.target.value)}
                          className="w-14 text-center font-medium text-[#334155] bg-transparent hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-[#E2DDD5] focus:border-[#FF8A00] outline-none py-1 transition-all"
                        />
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          disabled={submitted}
                          value={row.thu}
                          onChange={(e) => handleCellChange(row.id, 'thu', e.target.value)}
                          className="w-14 text-center font-medium text-[#334155] bg-transparent hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-[#E2DDD5] focus:border-[#FF8A00] outline-none py-1 transition-all"
                        />
                      </td>
                      <td className="py-4 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          disabled={submitted}
                          value={row.fri}
                          onChange={(e) => handleCellChange(row.id, 'fri', e.target.value)}
                          className="w-14 text-center font-medium text-[#334155] bg-transparent hover:bg-white focus:bg-white rounded-lg border border-transparent hover:border-[#E2DDD5] focus:border-[#FF8A00] outline-none py-1 transition-all"
                        />
                      </td>
                      <td className="py-4 text-right pr-4 font-bold text-[#1F2937]">
                        {calcRowTotal(row).toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}

                  {/* Total Hours Row */}
                  <tr className="border-t-2 border-[#F1ECE4] bg-[#FAF7F2]/40 font-bold">
                    <td className="py-4 pl-2 text-sm text-[#1F2937]">Total Hours</td>
                    <td className="py-4 text-center text-sm text-[#1F2937]">{monTotal.toFixed(1)}</td>
                    <td className="py-4 text-center text-sm text-[#1F2937]">{tueTotal.toFixed(1)}</td>
                    <td className="py-4 text-center text-sm text-[#1F2937]">{wedTotal.toFixed(1)}</td>
                    <td className="py-4 text-center text-sm text-[#1F2937]">{thuTotal.toFixed(1)}</td>
                    <td className="py-4 text-center text-sm text-[#1F2937]">{friTotal.toFixed(1)}</td>
                    <td className="py-4 text-right pr-4 text-base font-extrabold text-[#FF7A00]">
                      {grandTotal.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#F1ECE4]">
              <button
                onClick={handleExportTimesheetCSV}
                className="px-4 py-2.5 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#1F2937] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={submitted}
                className="px-5 py-2.5 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:text-[#1F2937] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={handleSubmitTimesheet}
                disabled={submitted}
                className={`px-6 py-2.5 rounded-full text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 active:scale-98 ${
                  submitted
                    ? 'bg-[#16A34A] cursor-default'
                    : 'bg-[#FF8A00] hover:bg-[#E67C00]'
                }`}
              >
                {submitted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submitted for Approval</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Timesheet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Team Timesheet Submissions Tab */
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#1F2937] mb-4">Pending Team Submissions</h2>
          {teamSubmissions.length === 0 ? (
            <div className="text-center py-12 text-[#8A92A6] text-xs">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2 opacity-80" />
              No pending timesheet submissions requiring your review.
            </div>
          ) : (
            <div className="space-y-3">
              {teamSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/40 hover:bg-[#FAF7F2] transition-colors"
                >
                  <div>
                    <span className="font-semibold text-xs text-[#1F2937] block">
                      {sub.employee?.firstName} {sub.employee?.lastName}
                    </span>
                    <span className="text-[11px] text-[#8A92A6]">
                      Date: {sub.periodStartDate ? new Date(sub.periodStartDate).toLocaleDateString() : 'Weekly'} • {sub.totalMinutes ? (sub.totalMinutes / 60).toFixed(1) : 40} hrs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await api.timesheets.approve(sub.id, 'Approved via timesheet dashboard');
                        setTeamSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
                        setFeedback({ type: 'success', message: 'Timesheet approved successfully!' });
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => {
                        await api.timesheets.reject(sub.id, 'Hours require revision');
                        setTeamSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
                        setFeedback({ type: 'error', message: 'Timesheet returned for revision.' });
                      }}
                      className="px-3 py-1.5 rounded-full border border-[#FECACA] text-[#DC2626] text-xs font-semibold hover:bg-[#FEF2F2] transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
              <h2 className="text-base font-bold text-[#1F2937]">Add Project Timesheet Entry</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Select Project</label>
                <select
                  value={newEntryProject}
                  onChange={(e) => setNewEntryProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                >
                  {projectsList.length > 0 ? (
                    projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="proj-1">HRMS Platform</option>
                      <option value="proj-2">Mobile App</option>
                      <option value="proj-3">Client Portal</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Task / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Backend API, Code Review, Architecture"
                  value={newEntryTask}
                  onChange={(e) => setNewEntryTask(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Daily Target Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={newEntryHours}
                  onChange={(e) => setNewEntryHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1ECE4]">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
              >
                Add Row
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
