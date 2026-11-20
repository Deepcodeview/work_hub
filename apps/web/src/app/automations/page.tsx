'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Check,
  X,
  Plus,
} from '../../components/icons';
import { api } from '../../lib/api';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  isActive: boolean;
  runCount?: number;
  lastRunAt?: string;
}

interface PendingAiAction {
  id: string;
  actionType: string;
  summary?: string;
  proposedPayload: Record<string, any>;
  createdAt?: string;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: 'rule-1',
      name: 'Urgent Task Notification',
      description: 'Notify project lead immediately when an urgent task is created',
      triggerEvent: 'TASK_CREATED',
      isActive: true,
      runCount: 28,
      lastRunAt: '10 mins ago',
    },
    {
      id: 'rule-2',
      name: 'Auto-Acknowledge Leave Requests',
      description: 'Send confirmation email and notify reporting manager upon leave submission',
      triggerEvent: 'LEAVE_REQUESTED',
      isActive: true,
      runCount: 14,
      lastRunAt: '2 hours ago',
    },
    {
      id: 'rule-3',
      name: 'Timesheet Reminder',
      description: 'Trigger weekly notification to employees with unsubmitted timesheets',
      triggerEvent: 'WEEKLY_SCHEDULE',
      isActive: true,
      runCount: 104,
      lastRunAt: 'Yesterday',
    },
  ]);

  const [pendingActions, setPendingActions] = useState<PendingAiAction[]>([
    {
      id: 'conf-1',
      actionType: 'CREATE_TASK',
      summary: 'Create follow-up task: "Review Quarterly Architecture Specs"',
      proposedPayload: {
        title: 'Review Quarterly Architecture Specs',
        priority: 'HIGH',
        estimatedMinutes: 90,
      },
    },
  ]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const [rulesRes, aiRes] = await Promise.all([
        api.automations.getRules(),
        api.automations.getPendingAiActions(),
      ]);

      if (rulesRes.success && Array.isArray(rulesRes.data) && rulesRes.data.length > 0) {
        setRules(rulesRes.data);
      }
      if (aiRes.success && Array.isArray(aiRes.data) && aiRes.data.length > 0) {
        setPendingActions(aiRes.data);
      }
    } catch (err) {
      console.error('Error fetching automations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleConfirmAction = async (id: string) => {
    try {
      if (!id.startsWith('conf-')) {
        await api.automations.confirmAiAction(id);
      }
      setPendingActions((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: 'success', message: 'Action approved and executed by WorkHub AI agent!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Confirmation failed' });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleRejectAction = async (id: string) => {
    try {
      if (!id.startsWith('conf-')) {
        await api.automations.rejectAiAction(id);
      }
      setPendingActions((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: 'error', message: 'Proposed AI action dismissed.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed' });
    }
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
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Workplace Automations & AI</h1>
          <p className="text-xs sm:text-sm text-[#8A92A6]">
            Configure event-driven workflow rules, audit executions, and authorize AI copilot actions.
          </p>
        </div>

        <button
          onClick={async () => {
            const res = await api.automations.triggerEvent('WEEKLY_SCHEDULE', { manual: true });
            setFeedback({ type: 'success', message: 'Triggered system test event successfully!' });
            setTimeout(() => setFeedback(null), 3500);
          }}
          className="px-4 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Trigger Automation</span>
        </button>
      </div>

      {/* Pending AI Proposed Actions */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            <h2 className="text-base font-bold text-[#1F2937]">
              Pending AI Action Confirmations ({pendingActions.length})
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#8A92A6]">Human-in-the-Loop Required</span>
        </div>

        {pendingActions.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#8A92A6]">
            No pending AI actions requiring confirmation.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="p-4 rounded-2xl border border-[#FFE2C8] bg-[#FFFBF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#FF7A00] bg-[#FFF0E0] px-2 py-0.5 rounded-full inline-block mb-1">
                    {action.actionType}
                  </span>
                  <h4 className="font-semibold text-sm text-[#1F2937]">
                    {action.summary || JSON.stringify(action.proposedPayload)}
                  </h4>
                  <pre className="text-[11px] text-[#64748B] mt-1 bg-white p-2 rounded-xl border border-[#F1ECE4] font-mono">
                    {JSON.stringify(action.proposedPayload, null, 2)}
                  </pre>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleConfirmAction(action.id)}
                    className="px-4 py-1.5 rounded-full bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Execute
                  </button>
                  <button
                    onClick={() => handleRejectAction(action.id)}
                    className="px-4 py-1.5 rounded-full border border-[#FECACA] text-[#DC2626] text-xs font-semibold hover:bg-[#FEF2F2] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Rules List */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 shadow-xs divide-y divide-[#F7F4EF]">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">Configured Automation Rules</h2>
        {rules.map((rule) => (
          <div key={rule.id} className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-[#1F2937]">{rule.name}</span>
                <span className="text-[10px] font-bold text-[#64748B] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E2DDD5]">
                  {rule.triggerEvent}
                </span>
              </div>
              <p className="text-xs text-[#8A92A6]">{rule.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#DCFCE7]">
                Active
              </span>
              <span className="text-xs text-[#8A92A6]">
                {rule.runCount || 0} runs
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
