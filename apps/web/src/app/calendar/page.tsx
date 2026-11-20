'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from '@workhub/ui';

interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  videoMeetingUrl?: string;
  startTime: string;
  endTime: string;
  status: string;
  organizer: { firstName: string; lastName: string; employeeCode: string };
  attendees: { status: string; employee: { firstName: string; lastName: string } }[];
  notes?: { id: string; content: string }[];
  actionItems?: { id: string; title: string; isCompleted: boolean }[];
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    videoMeeting: true,
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/calendar/events', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/v1/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ title: '', description: '', startTime: '', endTime: '', videoMeeting: true });
        fetchEvents();
      }
    } catch {
      // error handled
    }
  };

  const handleRespond = async (eventId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/calendar/events/${eventId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch {
      // error handled
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Company Calendar &amp; Meetings</h1>
          <p className="text-sm text-[#64748B]">Schedule team events, video conferences, meeting notes, and action items</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Schedule Event</Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-xl bg-white">
            <CardHeader>
              <CardTitle>Schedule Meeting / Event</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Event Title</label>
                  <Input
                    required
                    placeholder="e.g. Weekly Architecture Sync"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1">Start Time</label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1">End Time</label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Agenda / Description</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                    placeholder="Meeting topics..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="video"
                    checked={form.videoMeeting}
                    onChange={(e) => setForm({ ...form, videoMeeting: e.target.checked })}
                    className="rounded text-[#FF8A00]"
                  />
                  <label htmlFor="video" className="text-sm text-[#1F2937]">Generate WorkHub Video Meeting Room</label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#64748B]">Loading calendar schedule...</div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-base font-medium text-[#1F2937]">No events scheduled</p>
            <p className="text-sm text-[#64748B] mt-1 mb-4">You have a clean schedule. Book a meeting or team sync.</p>
            <Button onClick={() => setShowModal(true)}>+ Schedule First Event</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <Card key={ev.id} className="p-5 shadow-xs border-[#E2E8F0]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-base font-bold text-[#1F2937]">{ev.title}</h3>
                    <Badge status="info">
                      {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#64748B] mb-2">{ev.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-4 text-xs text-[#64748B]">
                    <span>Organizer: {ev.organizer.firstName} {ev.organizer.lastName}</span>
                    <span>&bull;</span>
                    <span>Date: {new Date(ev.startTime).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span>{ev.attendees.length} Attendees</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ev.videoMeetingUrl && (
                    <a
                      href={ev.videoMeetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#FFF3E8] text-[#FF8A00] font-medium text-xs rounded-md border border-[#FFE4CC] hover:bg-[#FFE0BD] transition-colors"
                    >
                      Join Video Call &rarr;
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleRespond(ev.id, 'ACCEPTED')}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRespond(ev.id, 'DECLINED')}>
                    Decline
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
