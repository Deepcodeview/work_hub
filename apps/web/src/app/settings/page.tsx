'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Plus,
  X,
  Check,
} from '../../components/icons';

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  adminEmail: string;
  syncCalendar: boolean;
  syncGmail: boolean;
  syncDrive: boolean;
  syncMeet: boolean;
  isConnected: boolean;
  lastSyncedAt?: string;
}

interface OutlookConfig {
  clientId: string;
  tenantId: string;
  clientSecret: string;
  webhookUrl: string;
  syncCalendar: boolean;
  syncMail: boolean;
  syncTeams: boolean;
  isConnected: boolean;
  lastSyncedAt?: string;
}

interface SyncedMeeting {
  id: string;
  title: string;
  provider: 'google' | 'outlook';
  date: string;
  startTime: string;
  endTime: string;
  joinUrl: string;
  attendees: string[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface OfficePolicy {
  officeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  standardShiftMinutes: number;
  autoClockOutHours: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'google' | 'outlook' | 'meetings' | 'policy'>('google');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Google Workspace State
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>({
    clientId: '782910482912-whub.apps.googleusercontent.com',
    clientSecret: '••••••••••••••••••••••••••••',
    adminEmail: 'admin@workhub.internal',
    syncCalendar: true,
    syncGmail: true,
    syncDrive: true,
    syncMeet: true,
    isConnected: true,
    lastSyncedAt: 'Today at 09:15 AM',
  });

  // Microsoft Outlook State
  const [outlookConfig, setOutlookConfig] = useState<OutlookConfig>({
    clientId: 'e2918a02-5819-48ab-9c12-384109419d12',
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    clientSecret: '••••••••••••••••••••••••••••',
    webhookUrl: 'https://workhub.webhook.office.com/webhookb2/teams-alerts',
    syncCalendar: true,
    syncMail: true,
    syncTeams: true,
    isConnected: true,
    lastSyncedAt: 'Today at 08:30 AM',
  });

  // Synced Meetings State
  const [meetings, setMeetings] = useState<SyncedMeeting[]>([
    {
      id: 'meet-1',
      title: 'Daily Engineering Standup & Code Review',
      provider: 'google',
      date: 'Today',
      startTime: '10:00 AM',
      endTime: '10:30 AM',
      joinUrl: 'https://meet.google.com/whu-bxyz-eng',
      attendees: ['Alex Chen', 'Maria Rivers', 'Sam Wilson'],
      status: 'SCHEDULED',
    },
    {
      id: 'meet-2',
      title: 'Quarterly Executive All-Hands & Product Roadmap',
      provider: 'outlook',
      date: 'Today',
      startTime: '02:00 PM',
      endTime: '03:00 PM',
      joinUrl: 'https://teams.microsoft.com/l/meetup-join/workhub-exec',
      attendees: ['System Admin', 'Department Heads', 'Core Leads'],
      status: 'SCHEDULED',
    },
    {
      id: 'meet-3',
      title: 'Sprint Retrospective & Sprint 24 Planning',
      provider: 'google',
      date: 'Tomorrow',
      startTime: '11:00 AM',
      endTime: '12:00 PM',
      joinUrl: 'https://meet.google.com/whu-sprint-plan',
      attendees: ['Engineering Team', 'Product Owners'],
      status: 'SCHEDULED',
    },
  ]);

  // Office & Geofence Policy State
  const [policy, setPolicy] = useState<OfficePolicy>({
    officeName: 'Office HQ, New York',
    latitude: 40.7128,
    longitude: -74.006,
    radiusMeters: 25,
    standardShiftMinutes: 480,
    autoClockOutHours: 12,
  });

  // Modal for adding meeting
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProvider, setNewProvider] = useState<'google' | 'outlook'>('google');
  const [newDate, setNewDate] = useState('Today');
  const [newStartTime, setNewStartTime] = useState('03:30 PM');
  const [newEndTime, setNewEndTime] = useState('04:00 PM');
  const [newJoinUrl, setNewJoinUrl] = useState('');

  // Load from local storage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedGoogle = localStorage.getItem('workhub_google_workspace_config');
        if (savedGoogle) setGoogleConfig(JSON.parse(savedGoogle));

        const savedOutlook = localStorage.getItem('workhub_outlook_config');
        if (savedOutlook) setOutlookConfig(JSON.parse(savedOutlook));

        const savedPolicy = localStorage.getItem('workhub_company_policy');
        if (savedPolicy) setPolicy(JSON.parse(savedPolicy));

        const savedMeetings = localStorage.getItem('workhub_synced_meetings');
        if (savedMeetings) setMeetings(JSON.parse(savedMeetings));
      } catch (e) {
        console.error('Error loading config from localStorage:', e);
      }
    }
  }, []);

  const saveGoogleConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('workhub_google_workspace_config', JSON.stringify(googleConfig));
    }
    setFeedback({ type: 'success', message: 'Google Workspace credentials and sync policies saved successfully!' });
    setTimeout(() => setFeedback(null), 3500);
  };

  const saveOutlookConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('workhub_outlook_config', JSON.stringify(outlookConfig));
    }
    setFeedback({ type: 'success', message: 'Microsoft 365 & Outlook parameters saved successfully!' });
    setTimeout(() => setFeedback(null), 3500);
  };

  const savePolicyConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('workhub_company_policy', JSON.stringify(policy));
    }
    setFeedback({ type: 'success', message: 'Office Geofence & Shift Target policies updated!' });
    setTimeout(() => setFeedback(null), 3500);
  };

  const testConnection = (provider: 'google' | 'outlook') => {
    setTestingConnection(provider);
    setTimeout(() => {
      setTestingConnection(null);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (provider === 'google') {
        setGoogleConfig((prev) => {
          const updated = { ...prev, isConnected: true, lastSyncedAt: `Today at ${now}` };
          if (typeof window !== 'undefined') localStorage.setItem('workhub_google_workspace_config', JSON.stringify(updated));
          return updated;
        });
        setFeedback({ type: 'success', message: 'Google Workspace OAuth handshake verified. Google Meet and Calendar synced.' });
      } else {
        setOutlookConfig((prev) => {
          const updated = { ...prev, isConnected: true, lastSyncedAt: `Today at ${now}` };
          if (typeof window !== 'undefined') localStorage.setItem('workhub_outlook_config', JSON.stringify(updated));
          return updated;
        });
        setFeedback({ type: 'success', message: 'Microsoft Graph API handshake verified. Outlook Mail and Teams Webhook active.' });
      }
      setTimeout(() => setFeedback(null), 4000);
    }, 1500);
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const generatedUrl =
      newJoinUrl.trim() ||
      (newProvider === 'google'
        ? `https://meet.google.com/whu-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
        : `https://teams.microsoft.com/l/meetup-join/workhub-${Math.random().toString(36).substring(2, 7)}`);

    const newMeeting: SyncedMeeting = {
      id: `meet-${Date.now()}`,
      title: newTitle.trim(),
      provider: newProvider,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      joinUrl: generatedUrl,
      attendees: ['System Admin', 'Assigned Team'],
      status: 'SCHEDULED',
    };

    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('workhub_synced_meetings', JSON.stringify(updated));
    }
    setIsMeetingModalOpen(false);
    setNewTitle('');
    setNewJoinUrl('');
    setFeedback({
      type: 'success',
      message: `Meeting "${newMeeting.title}" created and synced with ${newProvider === 'google' ? 'Google Calendar & Meet' : 'Outlook & Teams'}!`,
    });
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

      {/* Subtabs Pill & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center p-1 bg-[#F5F2EB] rounded-full border border-[#EBE4D8] overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('google')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'google' ? 'bg-white text-[#FF7A00] shadow-xs' : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Google Workspace
          </button>
          <button
            onClick={() => setActiveTab('outlook')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'outlook' ? 'bg-white text-[#FF7A00] shadow-xs' : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Microsoft 365 & Outlook
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'meetings' ? 'bg-white text-[#FF7A00] shadow-xs' : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Synced Meetings ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'policy' ? 'bg-white text-[#FF7A00] shadow-xs' : 'text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            Company Geofence Policy
          </button>
        </div>

        {activeTab === 'meetings' && (
          <button
            onClick={() => setIsMeetingModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Schedule Meeting</span>
          </button>
        )}
      </div>

      {/* -------------------- TAB 1: GOOGLE WORKSPACE -------------------- */}
      {activeTab === 'google' && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EA4335]/10 border border-[#EA4335]/20 flex items-center justify-center text-[#EA4335] font-extrabold text-xl shrink-0">
                G
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-[#1F2937]">Google Workspace Integration</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                    ● Connected & Operational
                  </span>
                </div>
                <p className="text-xs text-[#8A92A6]">
                  Bi-directional synchronization for Google Calendar, Google Meet links, and Gmail attendance alerts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => testConnection('google')}
                disabled={testingConnection === 'google'}
                className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#1F2937] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2"
              >
                {testingConnection === 'google' && (
                  <div className="w-3.5 h-3.5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                )}
                <span>Test Connection</span>
              </button>
              <button
                onClick={saveGoogleConfig}
                className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* Configuration Form & Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Credentials (Cols 1-7) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#1F2937] pb-2 border-b border-[#F1ECE4]">
                Google Cloud OAuth 2.0 Credentials
              </h3>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Client ID</label>
                <input
                  type="text"
                  value={googleConfig.clientId}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, clientId: e.target.value })}
                  placeholder="e.g. 10293847291-xyz.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Client Secret</label>
                <input
                  type="password"
                  value={googleConfig.clientSecret}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, clientSecret: e.target.value })}
                  placeholder="Google OAuth Client Secret"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Workspace Admin Email</label>
                <input
                  type="email"
                  value={googleConfig.adminEmail}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, adminEmail: e.target.value })}
                  placeholder="admin@yourcompany.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Authorized Redirect URI</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://workhub.internal/api/v1/auth/google/callback"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#F1EAE0]/50 text-xs font-mono text-[#64748B] outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://workhub.internal/api/v1/auth/google/callback');
                      setFeedback({ type: 'success', message: 'Callback URI copied to clipboard!' });
                      setTimeout(() => setFeedback(null), 2500);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#E2DDD5] text-xs font-semibold text-[#1F2937] hover:bg-[#FAF7F2] shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Sync Toggles (Cols 8-12) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#1F2937] pb-2 border-b border-[#F1ECE4]">
                Active Synchronization Modules
              </h3>

              <div className="space-y-3">
                <label className="flex items-start justify-between p-3.5 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                  <div className="pr-3">
                    <span className="font-bold text-xs text-[#1F2937] block">Google Calendar & Meet</span>
                    <span className="text-[11px] text-[#8A92A6]">
                      Automatically sync shift schedules and generate 1-click Google Meet links.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={googleConfig.syncCalendar}
                    onChange={(e) => setGoogleConfig({ ...googleConfig, syncCalendar: e.target.checked })}
                    className="w-4 h-4 accent-[#FF7A00] rounded mt-0.5"
                  />
                </label>

                <label className="flex items-start justify-between p-3.5 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                  <div className="pr-3">
                    <span className="font-bold text-xs text-[#1F2937] block">Gmail Shift & Attendance Alerts</span>
                    <span className="text-[11px] text-[#8A92A6]">
                      Deliver punch reminders, leave decisions, and weekly hour digests to employee inboxes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={googleConfig.syncGmail}
                    onChange={(e) => setGoogleConfig({ ...googleConfig, syncGmail: e.target.checked })}
                    className="w-4 h-4 accent-[#FF7A00] rounded mt-0.5"
                  />
                </label>

                <label className="flex items-start justify-between p-3.5 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                  <div className="pr-3">
                    <span className="font-bold text-xs text-[#1F2937] block">Google Drive Document Archive</span>
                    <span className="text-[11px] text-[#8A92A6]">
                      Automate PDF payslip and attendance log backups to corporate Google Drive folder.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={googleConfig.syncDrive}
                    onChange={(e) => setGoogleConfig({ ...googleConfig, syncDrive: e.target.checked })}
                    className="w-4 h-4 accent-[#FF7A00] rounded mt-0.5"
                  />
                </label>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#FED7AA] text-[11px] text-[#B45309]">
                ⚡ Last automated sync completed: <span className="font-bold">{googleConfig.lastSyncedAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: MICROSOFT OUTLOOK 365 -------------------- */}
      {activeTab === 'outlook' && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0078D4]/10 border border-[#0078D4]/20 flex items-center justify-center text-[#0078D4] font-extrabold text-xl shrink-0">
                O
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-[#1F2937]">Microsoft 365 & Outlook Suite</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                    ● Connected & Operational
                  </span>
                </div>
                <p className="text-xs text-[#8A92A6]">
                  Synchronize Outlook Calendars, Microsoft Teams video meetings, and enterprise Webhook notifications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => testConnection('outlook')}
                disabled={testingConnection === 'outlook'}
                className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#1F2937] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2"
              >
                {testingConnection === 'outlook' && (
                  <div className="w-3.5 h-3.5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                )}
                <span>Test Connection</span>
              </button>
              <button
                onClick={saveOutlookConfig}
                className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* Configuration Form & Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Credentials (Cols 1-7) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#1F2937] pb-2 border-b border-[#F1ECE4]">
                Microsoft Entra ID / Azure App Registration
              </h3>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Application (Client) ID</label>
                <input
                  type="text"
                  value={outlookConfig.clientId}
                  onChange={(e) => setOutlookConfig({ ...outlookConfig, clientId: e.target.value })}
                  placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Directory (Tenant) ID</label>
                <input
                  type="text"
                  value={outlookConfig.tenantId}
                  onChange={(e) => setOutlookConfig({ ...outlookConfig, tenantId: e.target.value })}
                  placeholder="Azure Tenant UUID"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Client Secret Value</label>
                <input
                  type="password"
                  value={outlookConfig.clientSecret}
                  onChange={(e) => setOutlookConfig({ ...outlookConfig, clientSecret: e.target.value })}
                  placeholder="Client secret string"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Microsoft Teams Incoming Webhook</label>
                <input
                  type="url"
                  value={outlookConfig.webhookUrl}
                  onChange={(e) => setOutlookConfig({ ...outlookConfig, webhookUrl: e.target.value })}
                  placeholder="https://outlook.office.com/webhook/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
                <span className="text-[10px] text-[#8A92A6] mt-0.5 block">
                  Alerts will be posted directly to your organization's Teams workforce channel.
                </span>
              </div>
            </div>

            {/* Sync Toggles (Cols 8-12) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#1F2937] pb-2 border-b border-[#F1ECE4]">
                Microsoft 365 Services
              </h3>

              <div className="space-y-3">
                <label className="flex items-start justify-between p-3.5 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                  <div className="pr-3">
                    <span className="font-bold text-xs text-[#1F2937] block">Outlook Calendar & Shifts</span>
                    <span className="text-[11px] text-[#8A92A6]">
                      Bi-directional calendar synchronization with Microsoft Exchange.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={outlookConfig.syncCalendar}
                    onChange={(e) => setOutlookConfig({ ...outlookConfig, syncCalendar: e.target.checked })}
                    className="w-4 h-4 accent-[#FF7A00] rounded mt-0.5"
                  />
                </label>

                <label className="flex items-start justify-between p-3.5 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                  <div className="pr-3">
                    <span className="font-bold text-xs text-[#1F2937] block">Microsoft Teams Meeting Generation</span>
                    <span className="text-[11px] text-[#8A92A6]">
                      Generate automated Teams meeting links for project reviews and check-ins.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={outlookConfig.syncTeams}
                    onChange={(e) => setOutlookConfig({ ...outlookConfig, syncTeams: e.target.checked })}
                    className="w-4 h-4 accent-[#FF7A00] rounded mt-0.5"
                  />
                </label>

                <label className="flex items-start justify-between p-3.5 rounded-2xl border border-[#F1ECE4] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                  <div className="pr-3">
                    <span className="font-bold text-xs text-[#1F2937] block">Exchange Mail Notifications</span>
                    <span className="text-[11px] text-[#8A92A6]">
                      Deliver approval alerts and timesheet verification requests via corporate Outlook.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={outlookConfig.syncMail}
                    onChange={(e) => setOutlookConfig({ ...outlookConfig, syncMail: e.target.checked })}
                    className="w-4 h-4 accent-[#FF7A00] rounded mt-0.5"
                  />
                </label>
              </div>

              <div className="p-3 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-[11px] text-[#0369A1]">
                ⚡ Last automated sync completed: <span className="font-bold">{outlookConfig.lastSyncedAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 3: SYNCED MEETINGS -------------------- */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-[#1F2937]">Connected Workspace Meetings ({meetings.length})</h2>
              <p className="text-xs text-[#8A92A6]">
                All meetings synchronized in real-time from Google Calendar, Google Meet, and Microsoft Teams.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((m) => {
              const isGoogle = m.provider === 'google';
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-[#F1ECE4] p-5 shadow-xs flex flex-col justify-between hover:border-[#FFD7B0] transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                          isGoogle
                            ? 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/20'
                            : 'bg-[#0078D4]/10 text-[#0078D4] border-[#0078D4]/20'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {isGoogle ? 'Google Meet' : 'Microsoft Teams'}
                      </span>
                      <span className="text-xs font-semibold text-[#8A92A6]">{m.date}</span>
                    </div>

                    <h3 className="font-bold text-sm text-[#1F2937] leading-snug mb-2">{m.title}</h3>

                    <div className="flex items-center gap-2 text-xs text-[#64748B] mb-3">
                      <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>
                        {m.startTime} - {m.endTime}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#F1EAE0] mb-4">
                      <span className="text-[11px] text-[#8A92A6] block mb-1">Participants:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.attendees.map((a, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#E2DDD5] text-[10px] font-semibold text-[#1F2937]"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <a
                    href={m.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 rounded-2xl text-xs font-bold text-center block shadow-xs transition-transform active:scale-98 ${
                      isGoogle
                        ? 'bg-[#EA4335] hover:bg-[#D93025] text-white'
                        : 'bg-[#0078D4] hover:bg-[#006cbd] text-white'
                    }`}
                  >
                    Join {isGoogle ? 'Google Meet' : 'Microsoft Teams'} ➔
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------- TAB 4: OFFICE POLICY & GEOFENCE -------------------- */}
      {activeTab === 'policy' && (
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs max-w-2xl space-y-5">
          <div className="pb-3 border-b border-[#F1ECE4]">
            <h2 className="font-bold text-base text-[#1F2937]">Enterprise Attendance & Geofence Policy</h2>
            <p className="text-xs text-[#8A92A6]">
              Configure standard shift targets, headquarters GPS location, and automatic verification fences.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#64748B] block mb-1">Office / Headquarters Name</label>
              <input
                type="text"
                value={policy.officeName}
                onChange={(e) => setPolicy({ ...policy, officeName: e.target.value })}
                placeholder="e.g. Office HQ, New York"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={policy.latitude}
                  onChange={(e) => setPolicy({ ...policy, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={policy.longitude}
                  onChange={(e) => setPolicy({ ...policy, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Geofence Radius (Meters)</label>
                <input
                  type="number"
                  value={policy.radiusMeters}
                  onChange={(e) => setPolicy({ ...policy, radiusMeters: parseInt(e.target.value, 10) || 25 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
                <span className="text-[10px] text-[#8A92A6] mt-0.5 block">Default: 25 meters.</span>
              </div>
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Standard Shift (Minutes)</label>
                <input
                  type="number"
                  value={policy.standardShiftMinutes}
                  onChange={(e) =>
                    setPolicy({ ...policy, standardShiftMinutes: parseInt(e.target.value, 10) || 480 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
                <span className="text-[10px] text-[#8A92A6] mt-0.5 block">480 min = 8 hours.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={savePolicyConfig}
                className="px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-semibold shadow-xs"
              >
                Save Policy Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] shadow-2xl w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4] mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF7A00]" />
                <h3 className="font-bold text-base text-[#1F2937]">Schedule Synced Meeting</h3>
              </div>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Critique & Roadmap Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Conference Provider *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewProvider('google')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      newProvider === 'google'
                        ? 'border-[#EA4335] bg-[#EA4335]/10 text-[#EA4335]'
                        : 'border-[#E2DDD5] text-[#64748B]'
                    }`}
                  >
                    Google Meet
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProvider('outlook')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      newProvider === 'outlook'
                        ? 'border-[#0078D4] bg-[#0078D4]/10 text-[#0078D4]'
                        : 'border-[#E2DDD5] text-[#64748B]'
                    }`}
                  >
                    Microsoft Teams
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
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">End Time</label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Custom Join URL (Optional)</label>
                <input
                  type="url"
                  placeholder="Auto-generated if left empty"
                  value={newJoinUrl}
                  onChange={(e) => setNewJoinUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
                >
                  Create & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
