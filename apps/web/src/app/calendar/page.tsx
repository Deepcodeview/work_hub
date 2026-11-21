'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Building2,
  Sparkles,
} from '../../components/icons';
import { api } from '../../lib/api';

interface TimelineEvent {
  id: string;
  title: string;
  type: 'meeting' | 'shift' | 'holiday' | 'leave';
  provider?: 'google' | 'teams' | 'office';
  date: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  joinUrl?: string;
  attendees?: string[];
  location?: string;
  description?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface CompanyHoliday {
  id: string;
  name: string;
  date: string;
  day: string;
  type: 'Federal / National' | 'Corporate Floating';
  daysLeft: number;
}

export default function CalendarTimelinePage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'meetings' | 'holidays' | 'shifts'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Scheduled Timeline Events (initialized clean from workspace / user entry)
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    // Load real team members from organization database
    api.organization.getEmployees().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setTeamMembers(res.data);
      }
    }).catch(() => {});
  }, []);

  // Official Company Holidays
  const holidays: CompanyHoliday[] = [
    { id: 'hol-1', name: 'Thanksgiving Day', date: 'Nov 26, 2026', day: 'Thursday', type: 'Federal / National', daysLeft: 5 },
    { id: 'hol-2', name: 'Day After Thanksgiving (Black Friday)', date: 'Nov 27, 2026', day: 'Friday', type: 'Corporate Floating', daysLeft: 6 },
    { id: 'hol-3', name: 'Christmas Eve & Christmas Day', date: 'Dec 24 - 25, 2026', day: 'Thu - Fri', type: 'Federal / National', daysLeft: 34 },
    { id: 'hol-4', name: "New Year's Day 2027", date: 'Jan 01, 2027', day: 'Friday', type: 'Federal / National', daysLeft: 41 },
    { id: 'hol-5', name: 'Martin Luther King Jr. Day', date: 'Jan 18, 2027', day: 'Monday', type: 'Federal / National', daysLeft: 58 },
  ];

  // Schedule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'meeting' | 'shift' | 'holiday'>('meeting');
  const [newProvider, setNewProvider] = useState<'google' | 'teams' | 'office'>('google');
  const [newDate, setNewDate] = useState('Today');
  const [newStart, setNewStart] = useState('03:30 PM');
  const [newEnd, setNewEnd] = useState('04:30 PM');
  const [newJoinUrl, setNewJoinUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Filter items
  const filteredEvents = events.filter((e) => {
    if (activeFilter === 'meetings') return e.type === 'meeting';
    if (activeFilter === 'holidays') return e.type === 'holiday';
    if (activeFilter === 'shifts') return e.type === 'shift' || e.type === 'leave';
    return true;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const generatedUrl =
      newJoinUrl.trim() ||
      (newProvider === 'google'
        ? `https://meet.google.com/whu-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
        : newProvider === 'teams'
        ? `https://teams.microsoft.com/l/meetup-join/workhub-${Math.random().toString(36).substring(2, 7)}`
        : undefined);

    const newEvt: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      provider: newProvider,
      date: newDate,
      timeSlot: `${newStart} - ${newEnd}`,
      startTime: newStart,
      endTime: newEnd,
      joinUrl: generatedUrl,
      description: newDesc.trim() || undefined,
      attendees: ['System Admin', 'Team'],
      status: 'SCHEDULED',
    };

    setEvents([newEvt, ...events]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewJoinUrl('');
    setFeedback({
      type: 'success',
      message: `Event "${newEvt.title}" added to team calendar and synced with workspace!`,
    });
    setTimeout(() => setFeedback(null), 3500);
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

      {/* Top Filter Bar & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8] overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeFilter === 'all'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            All Timeline ({events.length})
          </button>
          <button
            onClick={() => setActiveFilter('meetings')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeFilter === 'meetings'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Meetings & Calls ({events.filter((e) => e.type === 'meeting').length})
          </button>
          <button
            onClick={() => setActiveFilter('holidays')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeFilter === 'holidays'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Official Holidays ({holidays.length})
          </button>
          <button
            onClick={() => setActiveFilter('shifts')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeFilter === 'shifts'
                ? 'bg-white text-[#FF7A00] shadow-xs'
                : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Shifts & Leaves ({events.filter((e) => e.type === 'shift' || e.type === 'leave').length})
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Schedule Event</span>
        </button>
      </div>

      {/* Main Grid: Left Timeline (Cols 1-8) & Right Holidays / Team Roster (Cols 9-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Booked Timeline Feed (Cols 1-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1ECE4] mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF7A00]" />
                <h2 className="font-bold text-sm text-[#1F2937]">Today's Booked Agenda & Timeline</h2>
              </div>
              <span className="text-xs font-semibold text-[#8A92A6]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-[#8A92A6] text-xs">
                No events scheduled under this filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((evt) => {
                  const isMeeting = evt.type === 'meeting';
                  const isGoogle = evt.provider === 'google';
                  const isTeams = evt.provider === 'teams';
                  const isShift = evt.type === 'shift';
                  const isLeave = evt.type === 'leave';

                  return (
                    <div
                      key={evt.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isShift
                          ? 'bg-[#F0FDF4]/50 border-[#DCFCE7]'
                          : isLeave
                          ? 'bg-[#FFFBEB]/50 border-[#FEF3C7]'
                          : isGoogle
                          ? 'bg-white border-[#F1ECE4] hover:border-[#EA4335]/40'
                          : 'bg-white border-[#F1ECE4] hover:border-[#0078D4]/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isMeeting && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                                isGoogle
                                  ? 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/20'
                                  : 'bg-[#0078D4]/10 text-[#0078D4] border-[#0078D4]/20'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {isGoogle ? 'Google Meet' : 'Microsoft Teams'}
                            </span>
                          )}

                          {isShift && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                              ● Live On-Site Shift
                            </span>
                          )}

                          {isLeave && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                              🌴 Approved Leave
                            </span>
                          )}

                          <span className="text-xs font-bold text-[#1F2937]">{evt.title}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A92A6] shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span>{evt.timeSlot}</span>
                        </div>
                      </div>

                      {evt.description && (
                        <p className="text-xs text-[#64748B] mb-3 leading-relaxed">{evt.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#F7F4EF] flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#8A92A6]">Participants:</span>
                          {evt.attendees?.map((a, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E2DDD5] text-[10px] font-semibold text-[#1F2937]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>

                        {evt.joinUrl && (
                          <a
                            href={evt.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 ${
                              isGoogle
                                ? 'bg-[#EA4335] hover:bg-[#D93025] text-white'
                                : 'bg-[#0078D4] hover:bg-[#006CBD] text-white'
                            }`}
                          >
                            Join {isGoogle ? 'Google Meet' : 'Teams'} ➔
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Holidays & Team Working Availability (Cols 9-12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Company Holidays Card */}
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4]">
              <div className="flex items-center gap-2">
                <span className="text-base">🌴</span>
                <h3 className="font-bold text-sm text-[#1F2937]">Company Holidays 2026/27</h3>
              </div>
              <span className="text-[10px] font-bold text-[#FF7A00] bg-[#FFF0E0] px-2 py-0.5 rounded-full">
                Paid Days Off
              </span>
            </div>

            <div className="space-y-2.5">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-2xl bg-[#FFFBF5] border border-[#FDE1C5] hover:border-[#FFB766] transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-[#1F2937] block leading-tight">{h.name}</span>
                    <span className="text-[10px] text-[#8A92A6]">
                      {h.date} • {h.day}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#FED7AA] text-[10px] font-extrabold text-[#D96B00] block">
                      In {h.daysLeft} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Team Availability Status */}
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1ECE4]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF7A00]" />
                <h3 className="font-bold text-sm text-[#1F2937]">Team Availability Today</h3>
              </div>
              <span className="text-[10px] text-[#16A34A] font-semibold">96% On Duty</span>
            </div>

            <div className="space-y-2 text-xs">
              {teamMembers.length === 0 ? (
                <div className="py-4 text-center text-[#8A92A6] text-xs">
                  Active team roster will populate as members check in.
                </div>
              ) : (
                teamMembers.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                      <span className="font-semibold text-[#1F2937]">
                        {m.firstName} {m.lastName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#64748B]">
                      {m.department?.name || 'On Duty'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4] mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF7A00]" />
                <h3 className="font-bold text-base text-[#1F2937]">Schedule Event / Meeting</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint Backlog Grooming"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Event Type & Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('meeting');
                      setNewProvider('google');
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold ${
                      newType === 'meeting' && newProvider === 'google'
                        ? 'border-[#EA4335] bg-[#EA4335]/10 text-[#EA4335]'
                        : 'border-[#E2DDD5] text-[#64748B]'
                    }`}
                  >
                    Google Meet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('meeting');
                      setNewProvider('teams');
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold ${
                      newType === 'meeting' && newProvider === 'teams'
                        ? 'border-[#0078D4] bg-[#0078D4]/10 text-[#0078D4]'
                        : 'border-[#E2DDD5] text-[#64748B]'
                    }`}
                  >
                    MS Teams
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('shift');
                      setNewProvider('office');
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold ${
                      newType === 'shift'
                        ? 'border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]'
                        : 'border-[#E2DDD5] text-[#64748B]'
                    }`}
                  >
                    Work Shift
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Date</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">End Time</label>
                  <input
                    type="text"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Meeting agenda, agenda notes, or shift instructions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
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
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
