'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  Clock,
  FileText,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  Sparkles,
  Mail,
  CheckCircle2,
  Briefcase,
  CreditCard,
  Network,
  BarChart3,
  Building2,
  Settings,
  Play,
  Pause,
  Plus,
  X,
  ArrowRight,
  Download,
} from './icons';
import { api } from '../lib/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkAssistant?: () => void;
}

interface ActionItem {
  id: string;
  category: 'Navigation' | 'Quick Actions' | 'AI & Tools';
  title: string;
  subtitle?: string;
  icon: any;
  shortcut?: string;
  run: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenWorkAssistant }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleQuickClock = async (action: 'in' | 'out') => {
    onClose();
    try {
      if (action === 'in') {
        await api.attendance.clockIn();
        localStorage.setItem('workhub_clock_in_time', Date.now().toString());
      } else {
        await api.attendance.clockOut();
        localStorage.removeItem('workhub_clock_in_time');
      }
      router.push('/attendance');
    } catch {
      router.push('/attendance');
    }
  };

  const actions: ActionItem[] = [
    // Quick Actions
    {
      id: 'act-clock-in',
      category: 'Quick Actions',
      title: 'Clock In for Shift',
      subtitle: 'Start work stopwatch with GPS geofence verification',
      icon: Play,
      shortcut: '↵',
      run: () => handleQuickClock('in'),
    },
    {
      id: 'act-clock-out',
      category: 'Quick Actions',
      title: 'Clock Out for Day',
      subtitle: 'Finish shift and calculate total daily net hours',
      icon: Pause,
      run: () => handleQuickClock('out'),
    },
    {
      id: 'act-create-task',
      category: 'Quick Actions',
      title: 'Create New Task',
      subtitle: 'Add a new task to your active sprint board',
      icon: Plus,
      run: () => navigateTo('/tasks?new=true'),
    },
    {
      id: 'act-request-leave',
      category: 'Quick Actions',
      title: 'Apply for Leave / Time Off',
      subtitle: 'Submit annual, sick, or casual leave request',
      icon: Briefcase,
      run: () => navigateTo('/leave?apply=true'),
    },
    {
      id: 'act-log-timesheet',
      category: 'Quick Actions',
      title: 'Log Weekly Timesheet',
      subtitle: 'Allocate daily project hours and submit for manager approval',
      icon: FileText,
      run: () => navigateTo('/timesheets'),
    },

    // AI & Tools
    {
      id: 'ai-copilot',
      category: 'AI & Tools',
      title: 'Open AI Workplace Copilot',
      subtitle: 'Claude 3.5, Gemini 2.0 & Grok AI assistant',
      icon: Sparkles,
      shortcut: 'AI',
      run: () => {
        onClose();
        if (onOpenWorkAssistant) {
          onOpenWorkAssistant();
        } else {
          router.push('/chat');
        }
      },
    },
    {
      id: 'ai-schedule-meeting',
      category: 'AI & Tools',
      title: 'AI: Schedule Meeting',
      subtitle: 'Generate calendar invite, Google Meet link & agenda',
      icon: Calendar,
      run: () => {
        onClose();
        if (onOpenWorkAssistant) onOpenWorkAssistant();
        else router.push('/calendar');
      },
    },

    // Navigation Items
    {
      id: 'nav-home',
      category: 'Navigation',
      title: 'Dashboard Overview',
      subtitle: 'Home metrics, shift goal, and activity timeline',
      icon: Home,
      shortcut: 'G H',
      run: () => navigateTo('/'),
    },
    {
      id: 'nav-attendance',
      category: 'Navigation',
      title: 'Attendance & Time Tracker',
      subtitle: 'Live stopwatch, office geofence & history',
      icon: Clock,
      shortcut: 'G A',
      run: () => navigateTo('/attendance'),
    },
    {
      id: 'nav-timesheets',
      category: 'Navigation',
      title: 'Timesheets & Allocation',
      subtitle: 'Weekly timesheet submissions and manager approvals',
      icon: FileText,
      shortcut: 'G T',
      run: () => navigateTo('/timesheets'),
    },
    {
      id: 'nav-projects',
      category: 'Navigation',
      title: 'Projects & Milestones',
      subtitle: 'Project rosters, budgets, and milestone delivery',
      icon: FolderKanban,
      run: () => navigateTo('/projects'),
    },
    {
      id: 'nav-tasks',
      category: 'Navigation',
      title: 'Tasks & Sprint Kanban',
      subtitle: 'To Do, In Progress, and Completed board',
      icon: CheckSquare,
      run: () => navigateTo('/tasks'),
    },
    {
      id: 'nav-team',
      category: 'Navigation',
      title: 'Team Directory',
      subtitle: 'Employee profiles, roles, and department rosters',
      icon: Users,
      run: () => navigateTo('/team'),
    },
    {
      id: 'nav-calendar',
      category: 'Navigation',
      title: 'Team Calendar & Timelines',
      subtitle: 'Booked timelines, Google Meet / Teams calls & holidays',
      icon: Calendar,
      run: () => navigateTo('/calendar'),
    },
    {
      id: 'nav-mail',
      category: 'Navigation',
      title: 'Mail & Communications',
      subtitle: 'Outlook 365 and Google Workspace synced inbox',
      icon: Mail,
      run: () => navigateTo('/mail'),
    },
    {
      id: 'nav-documents',
      category: 'Navigation',
      title: 'Company Documents',
      subtitle: 'Central document storage, handbook, and policies',
      icon: FileText,
      run: () => navigateTo('/documents'),
    },
    {
      id: 'nav-approvals',
      category: 'Navigation',
      title: 'Approvals Queue',
      subtitle: 'Timesheet and leave approvals for managers & admins',
      icon: CheckCircle2,
      run: () => navigateTo('/approvals'),
    },
    {
      id: 'nav-leave',
      category: 'Navigation',
      title: 'Leaves & Time Off',
      subtitle: 'Annual, sick, and casual leave balances',
      icon: Briefcase,
      run: () => navigateTo('/leave'),
    },
    {
      id: 'nav-payroll',
      category: 'Navigation',
      title: 'Payroll & Compensation',
      subtitle: 'Monthly payslips, salary structures, and tax deductions',
      icon: CreditCard,
      run: () => navigateTo('/payroll'),
    },
    {
      id: 'nav-automations',
      category: 'Navigation',
      title: 'Automations & Rules',
      subtitle: 'Custom workplace triggers and webhook actions',
      icon: Network,
      run: () => navigateTo('/automations'),
    },
    {
      id: 'nav-reports',
      category: 'Navigation',
      title: 'Reports & Departments',
      subtitle: 'Department analytics, headcount, and budget tracking',
      icon: BarChart3,
      run: () => navigateTo('/departments'),
    },
    {
      id: 'nav-organization',
      category: 'Navigation',
      title: 'Organization Structure',
      subtitle: 'Corporate hierarchy, departments, and designations',
      icon: Building2,
      run: () => navigateTo('/organization'),
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Settings & AI Providers',
      subtitle: 'Configure Claude, Gemini, Grok keys and office geofence',
      icon: Settings,
      shortcut: 'G S',
      run: () => navigateTo('/settings'),
    },
    {
      id: 'nav-download',
      category: 'Navigation',
      title: 'Mobile Companion (APK & PWA)',
      subtitle: 'Download Android APK and install on home screen',
      icon: Download,
      shortcut: 'APK',
      run: () => navigateTo('/download'),
    },
  ];

  const filtered = actions.filter((act) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      act.title.toLowerCase().includes(q) ||
      (act.subtitle && act.subtitle.toLowerCase().includes(q)) ||
      act.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F1ECE4] bg-white">
          <Search className="w-5 h-5 text-[#FF7A00] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, action, or search page..."
            className="w-full bg-transparent border-none outline-none text-base text-[#1F2937] placeholder-[#9CA3AF]"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-[#8A94A6] bg-[#FAF7F2] border border-[#E2DDD5] rounded-md shadow-xs shrink-0">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-[#94A3B8] hover:text-[#1F2937] hover:bg-[#FAF7F2] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="overflow-y-auto flex-1 p-2 sm:p-3 divide-y divide-[#FAF7F2] max-h-[460px]"
        >
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8A92A6]">
              <Search className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm text-[#1F2937] mb-1">No matching results found</p>
              <p>Try searching for "Attendance", "Clock In", "AI", "Tasks", or "Leave".</p>
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => item.run()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FFF5EC] to-[#FFF0E0] text-[#1F2937] shadow-xs'
                      : 'hover:bg-[#FAF7F2] text-[#64748B]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#FF7A00] text-white shadow-md shadow-orange-500/25'
                          : 'bg-[#FAF7F2] text-[#8A92A6]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#1F2937] truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-[#EBE4D8] text-[#8A92A6]">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-[#8A92A6] truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-white border border-[#E2DDD5] text-[10px] font-bold text-[#8A92A6] shadow-2xs">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-[#FF7A00] translate-x-0.5' : 'text-[#CBD5E1]'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-2.5 bg-[#FAF7F2] border-t border-[#F1ECE4] flex items-center justify-between text-[11px] text-[#8A92A6]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E2DDD5] rounded text-[10px] font-bold">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E2DDD5] rounded text-[10px] font-bold">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E2DDD5] rounded text-[10px] font-bold">↵</kbd> to select
            </span>
          </div>
          <span className="font-medium text-[#FF7A00]">WorkHub Command Center</span>
        </div>
      </div>
    </div>
  );
}
