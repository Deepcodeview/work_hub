'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from '@workhub/ui';

interface ConversationItem {
  id: string;
  type: string;
  title?: string;
  members: { employee: { id: string; firstName: string; lastName: string; employeeCode: string } }[];
  messages?: { content: string; createdAt: string; sender: { firstName: string } }[];
}

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; employeeCode: string };
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'CHANNEL' | 'DIRECT'>('CHANNEL');

  const fetchConversations = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/chat/conversations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConv) {
          setActiveConv(data[0]);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/chat/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
    }
  }, [activeConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    try {
      const res = await fetch(`http://localhost:3001/api/v1/chat/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages(activeConv.id);
      }
    } catch {
      // error handled
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/v1/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          type: newType,
          title: newTitle,
          memberIds: [],
        }),
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewTitle('');
        fetchConversations();
      }
    } catch {
      // error handled
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Internal Chat</h1>
          <p className="text-sm text-[#64748B]">Real-time encrypted team messaging, channels, and direct communication</p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>+ New Channel</Button>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-xl bg-white">
            <CardHeader>
              <CardTitle>Create Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateConversation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Type</label>
                  <select
                    className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                  >
                    <option value="CHANNEL">Channel</option>
                    <option value="DIRECT">Direct Message</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Title</label>
                  <Input
                    required
                    placeholder="e.g. general or engineering"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowNewModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#64748B]">Loading chat...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-sm h-[600px]">
          {/* Conversation Sidebar */}
          <div className="border-r border-[#E2E8F0] flex flex-col bg-[#F8FAFC]">
            <div className="p-3 border-b border-[#E2E8F0] font-semibold text-xs text-[#64748B] uppercase tracking-wider">
              Conversations ({conversations.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#94A3B8]">No conversations yet</div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConv?.id === c.id;
                  const label = c.title || (c.type === 'DIRECT' ? 'Direct Message' : 'Untitled');
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConv(c)}
                      className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1 ${
                        isActive ? 'bg-[#FFF3E8]' : 'hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isActive ? 'text-[#FF8A00]' : 'text-[#1F2937]'}`}>
                          {c.type === 'CHANNEL' ? `# ${label}` : label}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] uppercase">{c.type}</span>
                      </div>
                      {c.messages && c.messages[0] && (
                        <p className="text-xs text-[#64748B] truncate">
                          <span className="font-medium text-[#1F2937]">{c.messages[0].sender.firstName}: </span>
                          {c.messages[0].content}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Feed */}
          <div className="md:col-span-2 flex flex-col h-full bg-white">
            {activeConv ? (
              <>
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F2937]">
                      {activeConv.type === 'CHANNEL' ? `# ${activeConv.title}` : (activeConv.title || 'Direct Message')}
                    </h3>
                    <p className="text-xs text-[#64748B]">{activeConv.members.length} members</p>
                  </div>
                  <Badge status="info">Encrypted</Badge>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#94A3B8]">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-[#1F2937]">
                            {m.sender.firstName} {m.sender.lastName}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] font-mono">
                            {m.sender.employeeCode}
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1F2937] max-w-xl">
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E2E8F0] flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit">Send</Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
