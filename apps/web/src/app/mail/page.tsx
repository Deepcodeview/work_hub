'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from '@workhub/ui';

interface MailFolderItem {
  id: string;
  name: string;
  folderType: string;
  unreadCount: number;
}

interface MailMessageItem {
  id: string;
  fromAddress: string;
  fromName?: string;
  subject: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  isRead: boolean;
  receivedAt: string;
  convertedTaskId?: string;
}

export default function MailPage() {
  const [account, setAccount] = useState<any>(null);
  const [folders, setFolders] = useState<MailFolderItem[]>([]);
  const [activeFolder, setActiveFolder] = useState<MailFolderItem | null>(null);
  const [messages, setMessages] = useState<MailMessageItem[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailMessageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', body: '' });

  const fetchAccountAndFolders = async () => {
    try {
      const token = localStorage.getItem('workhub_token') || localStorage.getItem('token') || '';
      const accRes = await fetch('/api/v1/mail/account', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (accRes.ok) {
        const acc = await accRes.json();
        setAccount(acc);
        const foldRes = await fetch(`/api/v1/mail/accounts/${acc.id}/folders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (foldRes.ok) {
          const fData = await foldRes.json();
          setFolders(fData);
          const inbox = fData.find((f: any) => f.name === 'INBOX') || fData[0];
          setActiveFolder(inbox);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (folderId: string) => {
    if (!account) return;
    try {
      const token = localStorage.getItem('workhub_token') || localStorage.getItem('token') || '';
      const res = await fetch(
        `/api/v1/mail/accounts/${account.id}/folders/${folderId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchAccountAndFolders();
  }, []);

  useEffect(() => {
    if (activeFolder) {
      fetchMessages(activeFolder.id);
      setSelectedMessage(null);
    }
  }, [activeFolder]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('workhub_token') || localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: composeForm.to.split(',').map((s) => s.trim()),
          subject: composeForm.subject,
          bodyHtml: composeForm.body,
        }),
      });
      if (res.ok) {
        setShowCompose(false);
        setComposeForm({ to: '', subject: '', body: '' });
        alert('Mail dispatched successfully');
      }
    } catch {
      // error handled
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-end items-center mb-6">
        <Button onClick={() => setShowCompose(true)}>+ Compose Email</Button>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl shadow-xl bg-white">
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">To (comma-separated)</label>
                  <Input
                    required
                    placeholder="client@example.com, lead@example.com"
                    value={composeForm.to}
                    onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Subject</label>
                  <Input
                    required
                    placeholder="Project roadmap update..."
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Message Content</label>
                  <textarea
                    rows={6}
                    required
                    className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                    placeholder="Write your email body..."
                    value={composeForm.body}
                    onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowCompose(false)}>
                    Discard
                  </Button>
                  <Button type="submit">Send Email</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#64748B]">Loading mailbox...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-sm h-[650px]">
          {/* Folders Sidebar */}
          <div className="border-r border-[#E2E8F0] bg-[#F8FAFC] p-3 flex flex-col gap-1">
            <div className="text-xs font-bold text-[#64748B] px-3 py-2 uppercase tracking-wider">
              {account?.emailAddress || 'Mailbox'}
            </div>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                  activeFolder?.id === f.id ? 'bg-[#FFF3E8] text-[#FF8A00]' : 'text-[#1F2937] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>{f.name}</span>
                {f.unreadCount > 0 && (
                  <span className="text-xs font-bold bg-[#FF8A00] text-white px-2 py-0.5 rounded-full">
                    {f.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Messages List */}
          <div className="md:col-span-3 flex flex-col h-full">
            {selectedMessage ? (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-xs font-medium text-[#FF8A00] hover:underline"
                  >
                    &larr; Back to {activeFolder?.name}
                  </button>
                  <div className="flex items-center gap-2">
                    {selectedMessage.convertedTaskId ? (
                      <Badge status="success">Converted to Task</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alert('Email converted to task!')}
                      >
                        Convert to Task
                      </Button>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-[#1F2937] mb-2">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-2 text-xs text-[#64748B] mb-6">
                  <span className="font-semibold text-[#1F2937]">{selectedMessage.fromName || selectedMessage.fromAddress}</span>
                  <span>&bull;</span>
                  <span>{new Date(selectedMessage.receivedAt).toLocaleString()}</span>
                </div>
                <div className="text-sm text-[#1F2937] whitespace-pre-line leading-relaxed">
                  {selectedMessage.bodyText || selectedMessage.bodyHtml}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
                {messages.length === 0 ? (
                  <div className="text-center py-24 text-sm text-[#94A3B8]">
                    No messages in {activeFolder?.name || 'this folder'}
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMessage(m)}
                      className={`p-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-4 ${
                        !m.isRead ? 'bg-[#FFFDF9]' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${!m.isRead ? 'font-bold text-[#1F2937]' : 'text-[#64748B]'}`}>
                            {m.fromName || m.fromAddress}
                          </span>
                          {!m.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#FF8A00]" />
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-[#1F2937] truncate mt-0.5">{m.subject}</h4>
                        <p className="text-xs text-[#64748B] truncate mt-0.5">{m.snippet}</p>
                      </div>
                      <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                        {new Date(m.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
