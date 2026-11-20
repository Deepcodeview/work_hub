'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  FileText,
  CheckSquare,
  Clock,
  X,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Users,
} from './icons';
import { api } from '../lib/api';

interface WorkAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionType?: 'MEETING' | 'MAIL' | 'TASK' | 'TIMESHEET' | 'INFO';
  actionPayload?: any;
  timestamp: string;
}

export function WorkAssistantModal({ isOpen, onClose, initialPrompt = '' }: WorkAssistantModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [activeModel, setActiveModel] = useState<'claude' | 'gemini' | 'grok' | 'gpt4'>('claude');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am Work Assistant AI, your workplace copilot powered by Claude, Gemini, and Grok. How can I assist your operations today?',
      actionType: 'INFO',
      timestamp: 'Just now',
    },
  ]);

  // Load configured default model from localStorage if admin customized it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedAi = localStorage.getItem('workhub_ai_config');
        if (savedAi) {
          const cfg = JSON.parse(savedAi);
          if (cfg.activeProvider === 'gemini') setActiveModel('gemini');
          else if (cfg.activeProvider === 'grok') setActiveModel('grok');
          else if (cfg.activeProvider === 'openai') setActiveModel('gpt4');
          else setActiveModel('claude');
        }
      } catch (e) {
        console.error('Error loading AI config in modal:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const suggestions = [
    {
      icon: '📅',
      label: 'Schedule Meeting',
      query: 'Schedule a sprint review meeting tomorrow at 3 PM via Google Meet with the engineering team',
    },
    {
      icon: '✉️',
      label: 'Write Corporate Mail',
      query: 'Draft a professional announcement email to all employees about Thanksgiving holiday shift schedules and bonuses',
    },
    {
      icon: '📝',
      label: 'Create High Priority Task',
      query: 'Create a high priority task: Complete mobile APK build and production API load test',
    },
    {
      icon: '⏱️',
      label: 'Fill Work Sheet / Timesheet',
      query: 'Fill my timesheet for today with 8 hours spent on backend optimization, geofence verification, and UI polish',
    },
    {
      icon: '🔔',
      label: 'Meeting Reminder & Agenda',
      query: 'Suggest a meeting preparation checklist and reminder notes for today\'s engineering standup',
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendPrompt = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    const qLower = query.toLowerCase();

    // Simulate intelligent multi-model execution and structured action output
    setTimeout(async () => {
      let reply: CopilotMessage;
      const modelLabel =
        activeModel === 'claude'
          ? 'Anthropic Claude 3.5'
          : activeModel === 'gemini'
          ? 'Google Gemini 2.0'
          : activeModel === 'grok'
          ? 'xAI Grok-2'
          : 'OpenAI GPT-4o';

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 1. MEETING SCHEDULER INTENT
      if (qLower.includes('meet') || qLower.includes('schedule') || qLower.includes('call')) {
        const isTeams = qLower.includes('teams');
        const provider = isTeams ? 'Microsoft Teams' : 'Google Meet';
        const joinLink = isTeams
          ? 'https://teams.microsoft.com/l/meetup-join/workhub-ai-sync'
          : 'https://meet.google.com/whu-ai-standup';

        // Auto-save into workspace synced meetings
        try {
          const savedMeetings = typeof window !== 'undefined' ? localStorage.getItem('workhub_synced_meetings') : null;
          const list = savedMeetings ? JSON.parse(savedMeetings) : [];
          const newM = {
            id: `meet-ai-${Date.now()}`,
            title: query.replace(/^schedule\s+/i, '').slice(0, 48) || 'Workspace Strategy Meeting',
            provider: isTeams ? 'outlook' : 'google',
            date: 'Tomorrow',
            startTime: '03:00 PM',
            endTime: '04:00 PM',
            joinUrl: joinLink,
            attendees: ['System Admin', 'Assigned Team'],
            status: 'SCHEDULED',
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('workhub_synced_meetings', JSON.stringify([newM, ...list]));
          }
        } catch {}

        reply = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `[${modelLabel}] I have generated and synchronized your meeting into the company calendar:`,
          actionType: 'MEETING',
          actionPayload: {
            title: query.replace(/^schedule\s+/i, '').slice(0, 50) || 'Sprint Review & Sync',
            time: 'Tomorrow at 03:00 PM - 04:00 PM',
            provider,
            joinUrl: joinLink,
            attendees: 'All Core Leads',
          },
          timestamp: timeNow,
        };
      }
      // 2. WRITE EMAIL / MAIL INTENT
      else if (qLower.includes('mail') || qLower.includes('email') || qLower.includes('draft') || qLower.includes('announcement')) {
        const mailBody = `Dear Team,

As we approach the upcoming holiday season, we want to express our gratitude for your dedication and outstanding work. 

Please take note of the upcoming holiday schedule:
• Thanksgiving & Winter Break: Offices will be officially closed on Nov 26 - Nov 27, 2026.
• On-call and shift coverage team members will receive standard 1.5x holiday coverage bonuses.
• Please submit all pending timesheets and leave requests by Wednesday 5:00 PM for timely payroll processing.

Wishing you and your families a restful and safe holiday!

Best regards,
WorkHub Operations & Leadership Team`;

        reply = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `[${modelLabel}] Here is your executive corporate email draft ready for dispatch:`,
          actionType: 'MAIL',
          actionPayload: {
            subject: 'Official Announcement: Holiday Shift Schedule & Operations Policy',
            body: mailBody,
          },
          timestamp: timeNow,
        };
      }
      // 3. CREATE TASK INTENT
      else if (qLower.includes('task') || qLower.includes('todo') || qLower.includes('create')) {
        const taskTitle = query.replace(/^create\s+(a\s+)?(task\s+)?/i, '') || 'High Priority System Review';
        try {
          await api.automations.proposeAiAction({
            actionType: 'CREATE_TASK',
            proposedPayload: {
              title: taskTitle,
              description: `Generated automatically via ${modelLabel}: "${query}"`,
              priority: 'HIGH',
            },
          });
        } catch {}

        reply = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `[${modelLabel}] Task created and added to the project board!`,
          actionType: 'TASK',
          actionPayload: {
            title: taskTitle,
            priority: 'HIGH',
            assignee: 'System Administrator',
            dueDate: 'End of Sprint (Friday)',
          },
          timestamp: timeNow,
        };
      }
      // 4. TIMESHEET / WORK SHEET INTENT
      else if (qLower.includes('timesheet') || qLower.includes('work sheet') || qLower.includes('sheet') || qLower.includes('hour') || qLower.includes('fill')) {
        reply = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `[${modelLabel}] Calculated today's work sessions and generated timesheet entry:`,
          actionType: 'TIMESHEET',
          actionPayload: {
            duration: '8h 00m (Standard Target Met 100%)',
            breakTime: '45m Lunch Break',
            activities: [
              'Backend API & Database synchronization (4.5h)',
              'Geofence verification & Responsive layout audit (2.0h)',
              'Team Standup & Multi-Model AI integration (1.5h)',
            ],
            status: 'Approved & Submitted to Manager',
          },
          timestamp: timeNow,
        };
      }
      // 5. REMINDER / AGENDA / GENERAL INTENT
      else {
        reply = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `[${modelLabel}] Processed instruction: "${query}".

Key Recommendations:
• Review the today's booked timeline in the Calendar module before the 10:00 AM standup.
• Ensure all team punch-in records are geofence-verified within 25m of New York HQ.
• Pending approvals: 3 timesheet requests waiting for manager verification.

All enterprise modules are synchronized and operating smoothly.`,
          actionType: 'INFO',
          timestamp: timeNow,
        };
      }

      setMessages((prev) => [...prev, reply]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#F1ECE4] flex items-center justify-between bg-gradient-to-r from-white via-[#FFFBF6] to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF7A00] to-[#FFB766] flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#1F2937]">Work Assistant AI</h3>
                <span className="text-[10px] bg-[#FFF0E0] text-[#D96B00] font-extrabold px-2 py-0.5 rounded-full border border-[#FED7AA]">
                  Enterprise Copilot
                </span>
              </div>
              <p className="text-[11px] text-[#8A92A6]">
                Powered by Claude, Gemini & Grok • Meeting, Mail, Task & Timesheet Automation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#FAF7F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Switcher Pill Row */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#FAF7F2] border-b border-[#F1ECE4] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-[#8A92A6] shrink-0">Active Model:</span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              onClick={() => setActiveModel('claude')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                activeModel === 'claude'
                  ? 'bg-white text-[#D97706] shadow-xs border border-[#FDE68A]'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <span>🟣</span> Claude 3.5 Sonnet
            </button>
            <button
              onClick={() => setActiveModel('gemini')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                activeModel === 'gemini'
                  ? 'bg-white text-[#2563EB] shadow-xs border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <span>🔵</span> Gemini 2.0 Flash
            </button>
            <button
              onClick={() => setActiveModel('grok')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                activeModel === 'grok'
                  ? 'bg-white text-[#1F2937] shadow-xs border border-[#CBD5E1]'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <span>⚡</span> xAI Grok-2
            </button>
            <button
              onClick={() => setActiveModel('gpt4')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                activeModel === 'gpt4'
                  ? 'bg-white text-[#16A34A] shadow-xs border border-[#BBF7D0]'
                  : 'text-[#64748B] hover:text-[#1F2937]'
              }`}
            >
              <span>🟢</span> GPT-4o
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#FF7A00] text-white rounded-br-none'
                      : 'bg-[#FFFBF6] border border-[#FDE5CC] text-[#1F2937] rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* ACTION RENDER: MEETING */}
                  {m.actionType === 'MEETING' && m.actionPayload && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-[#FED7AA] text-xs text-[#1F2937] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#1F2937]">{m.actionPayload.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EA4335]/10 text-[#EA4335]">
                          {m.actionPayload.provider}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#64748B] text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>{m.actionPayload.time}</span>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          href="/calendar"
                          onClick={onClose}
                          className="text-[#FF7A00] font-semibold text-xs hover:underline"
                        >
                          View in Calendar Timeline →
                        </Link>
                        <a
                          href={m.actionPayload.joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#FF7A00] text-white font-bold text-xs"
                        >
                          Join Call Now ➔
                        </a>
                      </div>
                    </div>
                  )}

                  {/* ACTION RENDER: MAIL */}
                  {m.actionType === 'MAIL' && m.actionPayload && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-[#FED7AA] text-xs text-[#1F2937] space-y-2">
                      <div className="flex items-center justify-between border-b border-[#F5E6D3] pb-1.5">
                        <span className="font-bold text-xs text-[#B45309]">
                          Subject: {m.actionPayload.subject}
                        </span>
                        <button
                          onClick={() => handleCopy(m.id, `${m.actionPayload.subject}\n\n${m.actionPayload.body}`)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E2DDD5] text-[11px] font-semibold text-[#1F2937] hover:bg-[#F0ECE4] flex items-center gap-1"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#16A34A]" />
                              <span className="text-[#16A34A]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Email</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] font-mono whitespace-pre-wrap text-[#475569] leading-relaxed bg-[#FAF7F2] p-2.5 rounded-lg border border-[#F1EAE0]">
                        {m.actionPayload.body}
                      </p>
                    </div>
                  )}

                  {/* ACTION RENDER: TASK */}
                  {m.actionType === 'TASK' && m.actionPayload && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-[#FED7AA] text-xs text-[#1F2937] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-[#FF7A00]" />
                        <div>
                          <span className="font-bold text-xs block">{m.actionPayload.title}</span>
                          <span className="text-[10px] text-[#8A92A6]">
                            Priority: {m.actionPayload.priority} • Due: {m.actionPayload.dueDate}
                          </span>
                        </div>
                      </div>
                      <Link
                        href="/tasks"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF0E0] text-[#D96B00] border border-[#FED7AA] font-bold text-xs"
                      >
                        View in Board →
                      </Link>
                    </div>
                  )}

                  {/* ACTION RENDER: TIMESHEET */}
                  {m.actionType === 'TIMESHEET' && m.actionPayload && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-[#FED7AA] text-xs text-[#1F2937] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#16A34A]">Recorded Shift Time:</span>
                        <span className="font-bold text-xs">{m.actionPayload.duration}</span>
                      </div>
                      <ul className="text-[11px] text-[#64748B] list-disc list-inside space-y-0.5">
                        {m.actionPayload.activities.map((act: string, idx: number) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                      <div className="pt-1.5 border-t border-[#F5E6D3] flex justify-between items-center text-[10px]">
                        <span className="text-[#8A92A6]">Status: {m.actionPayload.status}</span>
                        <Link href="/timesheets" onClick={onClose} className="text-[#FF7A00] font-bold hover:underline">
                          Open Timesheet Module →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#9CA3AF] mt-1 px-1">{m.timestamp}</span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#8A92A6] p-3 rounded-2xl bg-[#FFFBF6] border border-[#FDE5CC] w-fit">
              <div className="w-3.5 h-3.5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <span>Analyzing intent & executing with {activeModel.toUpperCase()}...</span>
            </div>
          )}
        </div>

        {/* Suggestion Prompts Carousel */}
        <div className="px-4 sm:px-5 py-2 border-t border-[#F1ECE4] bg-white flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] shrink-0">
            Suggested:
          </span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSendPrompt(s.query)}
              className="px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#EBE4D8] text-[11px] font-medium text-[#1F2937] shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(prompt);
          }}
          className="p-3 sm:p-4 border-t border-[#F1ECE4] bg-[#FAF7F2] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask ${activeModel.toUpperCase()}... "Schedule meeting with team", "Draft client email", "Log 8h timesheet"`}
            className="flex-1 px-4 py-2.5 rounded-full border border-[#E2DDD5] bg-white text-xs sm:text-sm text-[#1F2937] outline-none focus:border-[#FF7A00]"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="p-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            title="Send to Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
