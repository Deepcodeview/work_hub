/**
 * WorkHub API Client
 * Centralized HTTP service for connecting the web frontend with the NestJS API.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface UserSession {
  token: string;
  user: {
    id: string;
    email: string;
    employee?: {
      id: string;
      firstName: string;
      lastName: string;
      departmentId?: string;
      employeeCode?: string;
    };
    roles: string[];
    permissions: string[];
  };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('workhub_token');
}

export function setStoredSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('workhub_token', session.token);
  localStorage.setItem('workhub_user', JSON.stringify(session.user));
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('workhub_token');
  localStorage.removeItem('workhub_user');
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('workhub_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Ensures a valid session exists. If not logged in, auto-authenticates
 * with the seeded admin account to ensure all features work out-of-the-box.
 */
export async function ensureSession(): Promise<string> {
  const existing = getStoredToken();
  if (existing) return existing;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@workhub.internal',
        password: 'Password123!',
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const token = json.data?.accessToken;
      if (token) {
        setStoredSession({
          token,
          user: json.data.user,
        });
        return token;
      }
    }
  } catch {
    // If backend is unreachable or offline, return empty string
  }
  return '';
}

/**
 * Robust fetch wrapper that attaches auth headers and handles JSON payloads.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; meta?: any }> {
  try {
    let token = getStoredToken();
    if (!token && typeof window !== 'undefined') {
      token = await ensureSession();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: body?.message || `HTTP error ${res.status}`,
      };
    }

    return {
      success: true,
      data: body?.data !== undefined ? body.data : body,
      meta: body?.meta,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error',
    };
  }
}

// -------------------------------------------------------------
// Module APIs
// -------------------------------------------------------------

export const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok && json.data?.accessToken) {
        setStoredSession({
          token: json.data.accessToken,
          user: json.data.user,
        });
      }
      return json;
    },
    logout: () => {
      clearStoredSession();
    },
    me: () => apiFetch('/auth/me'),
  },

  // Attendance
  attendance: {
    getStatus: () => apiFetch('/attendance/status'),
    clockIn: (data?: { latitude?: number; longitude?: number }) =>
      apiFetch('/attendance/clock-in', {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    clockOut: (data?: { latitude?: number; longitude?: number }) =>
      apiFetch('/attendance/clock-out', {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    startBreak: (breakType: string = 'BREAK') =>
      apiFetch('/attendance/breaks/start', {
        method: 'POST',
        body: JSON.stringify({ breakType }),
      }),
    endBreak: () =>
      apiFetch('/attendance/breaks/end', {
        method: 'POST',
      }),
    getHistory: () => apiFetch('/attendance/history'),
  },

  // Timesheets
  timesheets: {
    getDaily: (workDate?: string) =>
      apiFetch(`/timesheets/daily${workDate ? `?workDate=${workDate}` : ''}`),
    logDaily: (data: { workDate: string; entries: any[] }) =>
      apiFetch('/timesheets/daily', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submit: (timesheetId: string) =>
      apiFetch(`/timesheets/${timesheetId}/submit`, {
        method: 'POST',
      }),
    getPendingApprovals: () => apiFetch('/timesheets/pending-approvals'),
    approve: (id: string, comments?: string) =>
      apiFetch(`/timesheets/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      }),
    reject: (id: string, reason: string) =>
      apiFetch(`/timesheets/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Projects & Tasks
  projects: {
    list: () => apiFetch('/projects'),
    get: (id: string) => apiFetch(`/projects/${id}`),
    create: (data: any) =>
      apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetch(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    addMember: (id: string, data: any) =>
      apiFetch(`/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  tasks: {
    listByProject: (projectId: string, filters?: { status?: string; assigneeId?: string }) => {
      const q = new URLSearchParams();
      if (filters?.status) q.append('status', filters.status);
      if (filters?.assigneeId) q.append('assigneeId', filters.assigneeId);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return apiFetch(`/tasks/project/${projectId}${queryStr}`);
    },
    get: (id: string) => apiFetch(`/tasks/${id}`),
    create: (data: any) =>
      apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetch(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    assign: (id: string, employeeId: string, isPrimary: boolean = true) =>
      apiFetch(`/tasks/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ employeeId, isPrimary }),
      }),
    logTime: (id: string, data: { workDate: string; durationMinutes: number; description?: string }) =>
      apiFetch(`/tasks/${id}/time-logs`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Dashboard
  dashboard: {
    getSummary: () => apiFetch('/dashboard/summary'),
  },

  // Organization & Headcount
  organization: {
    getEmployees: (params?: { search?: string; departmentId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.departmentId) q.append('departmentId', params.departmentId);
      if (params?.status) q.append('status', params.status);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return apiFetch(`/employees${queryStr}`);
    },
    getEmployee: (id: string) => apiFetch(`/employees/${id}`),
    createEmployee: (data: any) =>
      apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDepartments: () => apiFetch('/departments'),
    getDepartment: (id: string) => apiFetch(`/departments/${id}`),
    createDepartment: (data: any) =>
      apiFetch('/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTree: () => apiFetch('/organization/tree'),
  },

  // HRMS: Leave & Payroll
  hrms: {
    getLeaveTypes: () => apiFetch('/hrms/leave-types'),
    getLeaveBalances: (year?: number) =>
      apiFetch(`/hrms/leave-balances${year ? `?year=${year}` : ''}`),
    applyLeave: (dto: { leaveTypeId: string; startDate: string; endDate: string; reason?: string }) =>
      apiFetch('/hrms/leaves/apply', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    getMyLeaves: () => apiFetch('/hrms/leaves/my-requests'),
    getPendingLeaves: () => apiFetch('/hrms/leaves/pending-approvals'),
    approveLeave: (id: string, comments?: string) =>
      apiFetch(`/hrms/leaves/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ comments }),
      }),
    rejectLeave: (id: string, comments?: string) =>
      apiFetch(`/hrms/leaves/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ comments }),
      }),
    getPayrollRuns: () => apiFetch('/hrms/payroll/runs'),
    createPayrollRun: (dto: { month: number; year: number }) =>
      apiFetch('/hrms/payroll/runs', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    getMyPayslips: () => apiFetch('/hrms/payroll/payslips'),
  },

  // Automations & AI Actions
  automations: {
    getRules: () => apiFetch('/automations/rules'),
    triggerEvent: (triggerEvent: string, payload: Record<string, any>) =>
      apiFetch('/automations/trigger', {
        method: 'POST',
        body: JSON.stringify({ triggerEvent, payload }),
      }),
    proposeAiAction: (data: { actionType: string; proposedPayload: any }) =>
      apiFetch('/automations/ai/propose', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getPendingAiActions: () => apiFetch('/automations/ai/pending'),
    confirmAiAction: (id: string) =>
      apiFetch(`/automations/ai/${id}/confirm`, {
        method: 'PATCH',
      }),
    rejectAiAction: (id: string) =>
      apiFetch(`/automations/ai/${id}/reject`, {
        method: 'PATCH',
      }),
  },
};
