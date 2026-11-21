'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

export interface AttendanceState {
  clockedIn: boolean;
  clockInTimestamp: number | null;
  onBreak: boolean;
  breakType?: string;
  elapsedSeconds: number;
  completedMinutesToday: number;
  completedMinutesThisWeek: number;
  totalBreakMinutesToday: number;
  loading: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  activeSessionId?: string;
}

const STORAGE_KEY = 'workhub_clock_in_time';
const BROADCAST_CHANNEL_NAME = 'workhub_attendance_sync';

export function useAttendanceSync() {
  const [state, setState] = useState<AttendanceState>({
    clockedIn: false,
    clockInTimestamp: null,
    onBreak: false,
    elapsedSeconds: 0,
    completedMinutesToday: 0,
    completedMinutesThisWeek: 0,
    totalBreakMinutesToday: 0,
    loading: true,
    syncing: false,
    lastSyncedAt: null,
  });

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel for cross-tab multi-window synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastRef.current = channel;
        channel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_REQUIRED') {
            fetchServerStatus(true);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted:', err);
      }
    }

    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  const notifyOtherTabs = () => {
    try {
      broadcastRef.current?.postMessage({ type: 'SYNC_REQUIRED', timestamp: Date.now() });
    } catch {
      // ignore
    }
  };

  /**
   * Authoritative server sync function.
   * Compares the database session with local state and keeps phone and web 100% in sync.
   */
  const fetchServerStatus = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setState((prev) => ({ ...prev, syncing: true }));
    }

    try {
      const res = await api.attendance.getStatus();

      if (res.success && res.data) {
        const session = res.data.activeSession || res.data.currentSession;
        const isClocked = Boolean(res.data.isClockedIn || res.data.hasOpenSession || session);
        const onBreak = Boolean(res.data.isOnBreak || res.data.activeBreak);

        if (isClocked && session?.clockInAt) {
          const serverStart = new Date(session.clockInAt).getTime();
          const startDate = new Date(session.clockInAt);
          const now = new Date();
          const isSameCalendarDay =
            startDate.getFullYear() === now.getFullYear() &&
            startDate.getMonth() === now.getMonth() &&
            startDate.getDate() === now.getDate();

          // If session is from a previous calendar day (e.g. yesterday before midnight), treat as closed for today
          if (!isSameCalendarDay) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(STORAGE_KEY);
            }
            setState((prev) => ({
              ...prev,
              clockedIn: false,
              clockInTimestamp: null,
              activeSessionId: undefined,
              onBreak: false,
              elapsedSeconds: 0,
              completedMinutesToday: typeof res.data.completedMinutesToday === 'number' ? res.data.completedMinutesToday : prev.completedMinutesToday,
              completedMinutesThisWeek: typeof res.data.completedMinutesThisWeek === 'number' ? res.data.completedMinutesThisWeek : prev.completedMinutesThisWeek,
              totalBreakMinutesToday: typeof res.data.totalBreakMinutesToday === 'number' ? res.data.totalBreakMinutesToday : prev.totalBreakMinutesToday,
              loading: false,
              syncing: false,
              lastSyncedAt: new Date(),
            }));
            return;
          }

          const elapsed = Math.max(0, Math.floor((Date.now() - serverStart) / 1000));

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, serverStart.toString());
          }

          setState((prev) => ({
            ...prev,
            clockedIn: true,
            clockInTimestamp: serverStart,
            activeSessionId: session.id,
            onBreak,
            breakType: res.data.activeBreak?.breakType || 'BREAK',
            elapsedSeconds: elapsed,
            completedMinutesToday: typeof res.data.completedMinutesToday === 'number' ? res.data.completedMinutesToday : prev.completedMinutesToday,
            completedMinutesThisWeek: typeof res.data.completedMinutesThisWeek === 'number' ? res.data.completedMinutesThisWeek : prev.completedMinutesThisWeek,
            totalBreakMinutesToday: typeof res.data.totalBreakMinutesToday === 'number' ? res.data.totalBreakMinutesToday : prev.totalBreakMinutesToday,
            loading: false,
            syncing: false,
            lastSyncedAt: new Date(),
          }));
        } else {
          // Definitely not clocked in on the server
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
          }

          setState((prev) => ({
            ...prev,
            clockedIn: false,
            clockInTimestamp: null,
            activeSessionId: undefined,
            onBreak: false,
            elapsedSeconds: 0,
            completedMinutesToday: typeof res.data.completedMinutesToday === 'number' ? res.data.completedMinutesToday : prev.completedMinutesToday,
            completedMinutesThisWeek: typeof res.data.completedMinutesThisWeek === 'number' ? res.data.completedMinutesThisWeek : prev.completedMinutesThisWeek,
            totalBreakMinutesToday: typeof res.data.totalBreakMinutesToday === 'number' ? res.data.totalBreakMinutesToday : prev.totalBreakMinutesToday,
            loading: false,
            syncing: false,
            lastSyncedAt: new Date(),
          }));
        }
      } else {
        // If API fails or user not logged in, stop loading
        setState((prev) => ({ ...prev, loading: false, syncing: false }));
      }
    } catch (err) {
      console.warn('Attendance server status sync failed:', err);
      setState((prev) => ({ ...prev, loading: false, syncing: false }));
    }
  }, []);

  // 1. Initial load
  useEffect(() => {
    fetchServerStatus(false);
  }, [fetchServerStatus]);

  // 2. Continuous 8-second polling so phone and web remain tightly locked
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchServerStatus(true);
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [fetchServerStatus]);

  // 3. Instant sync on tab focus or visibility change (when switching back to app)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchServerStatus(true);
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [fetchServerStatus]);

  // 4. Live 1-second ticking counter when active with midnight rollover reset
  useEffect(() => {
    let tickInterval: any = null;

    if (state.clockedIn && state.clockInTimestamp && !state.onBreak) {
      tickInterval = setInterval(() => {
        const now = new Date();
        const start = new Date(state.clockInTimestamp!);
        // If current day is different from clock-in day (passed midnight), refresh status to reset UI to Clock In
        if (
          now.getDate() !== start.getDate() ||
          now.getMonth() !== start.getMonth() ||
          now.getFullYear() !== start.getFullYear()
        ) {
          fetchServerStatus(false);
          return;
        }

        setState((prev) => {
          if (!prev.clockInTimestamp) return prev;
          const secs = Math.max(0, Math.floor((Date.now() - prev.clockInTimestamp) / 1000));
          return { ...prev, elapsedSeconds: secs };
        });
      }, 1000);
    }

    return () => {
      if (tickInterval) clearInterval(tickInterval);
    };
  }, [state.clockedIn, state.clockInTimestamp, state.onBreak, fetchServerStatus]);

  /**
   * Helper to fetch device coordinates
   */
  const getCoordinates = async (): Promise<{ latitude?: number; longitude?: number }> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve({ latitude: 40.7128, longitude: -74.006 }), // default office fallback
          { timeout: 4000, enableHighAccuracy: true }
        );
      } else {
        resolve({ latitude: 40.7128, longitude: -74.006 });
      }
    });
  };

  /**
   * Clock In action
   */
  const clockIn = async (): Promise<{ success: boolean; message: string }> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const coords = await getCoordinates();
      const res = await api.attendance.clockIn(coords);

      if (res.success && res.data) {
        const serverStart = new Date(res.data.clockInAt).getTime();
        setState((prev) => ({
          ...prev,
          clockedIn: true,
          clockInTimestamp: serverStart,
          activeSessionId: res.data.id,
          elapsedSeconds: Math.max(0, Math.floor((Date.now() - serverStart) / 1000)),
          loading: false,
          lastSyncedAt: new Date(),
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, serverStart.toString());
        }
        notifyOtherTabs();
        return { success: true, message: 'Clocked in successfully!' };
      } else {
        // If already clocked in on another device, fetch the open session from server
        await fetchServerStatus(false);
        notifyOtherTabs();
        if (res.error?.includes('already open')) {
          return { success: true, message: 'Existing active session synchronized from server!' };
        }
        if (res.error?.includes('401') || res.error?.includes('expired') || res.error?.includes('Unauthorized')) {
          return { success: false, message: 'Session expired. Please sign in again to clock in.' };
        }
        return { success: false, message: res.error || 'Failed to clock in' };
      }
    } catch (err: any) {
      await fetchServerStatus(false);
      notifyOtherTabs();
      return { success: false, message: err.message || 'Clock in network error' };
    }
  };

  /**
   * Clock Out action
   */
  const clockOut = async (): Promise<{ success: boolean; message: string; duration?: string }> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const coords = await getCoordinates();
      const res = await api.attendance.clockOut(coords);

      await fetchServerStatus(false);
      notifyOtherTabs();

      if (!res.success) {
        if (res.error?.includes('401') || res.error?.includes('expired') || res.error?.includes('Unauthorized')) {
          return { success: false, message: 'Session expired. Please sign in again to clock out.' };
        }
        return { success: false, message: res.error || 'Clock out failed' };
      }

      const hours = Math.floor(state.elapsedSeconds / 3600);
      const mins = Math.floor((state.elapsedSeconds % 3600) / 60);
      const secs = state.elapsedSeconds % 60;
      const durationStr = `${hours}h ${mins}m ${secs}s`;

      return {
        success: true,
        message: `Clocked out successfully. Duration: ${durationStr}`,
        duration: durationStr,
      };
    } catch (err: any) {
      await fetchServerStatus(false);
      notifyOtherTabs();
      return { success: false, message: err.message || 'Clock out error' };
    }
  };

  /**
   * Break actions
   */
  const startBreak = async (type = 'COFFEE'): Promise<{ success: boolean }> => {
    try {
      await api.attendance.startBreak(type);
      await fetchServerStatus(false);
      notifyOtherTabs();
      return { success: true };
    } catch {
      await fetchServerStatus(false);
      return { success: false };
    }
  };

  const endBreak = async (): Promise<{ success: boolean }> => {
    try {
      await api.attendance.endBreak();
      await fetchServerStatus(false);
      notifyOtherTabs();
      return { success: true };
    } catch {
      await fetchServerStatus(false);
      return { success: false };
    }
  };

  return {
    ...state,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    refresh: () => fetchServerStatus(false),
  };
}
