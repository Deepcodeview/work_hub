/**
 * WorkHub Role-Based Access Control and Permission Model
 * Derived from docs/RBAC.md
 */

export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  HR_ADMIN = 'HR_ADMIN',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  REPORTING_MANAGER = 'REPORTING_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  FINANCE = 'FINANCE',
  EMPLOYEE = 'EMPLOYEE',
}

export enum Scope {
  SELF = 'SELF',
  REPORTING_TEAM = 'REPORTING_TEAM',
  DEPARTMENT = 'DEPARTMENT',
  PROJECT = 'PROJECT',
  COMPANY = 'COMPANY',
}

export const Permissions = {
  // Employee
  EMPLOYEE_READ_SELF: 'employee.read.self',
  EMPLOYEE_READ_REPORTING_TEAM: 'employee.read.reporting_team',
  EMPLOYEE_READ_DEPARTMENT: 'employee.read.department',
  EMPLOYEE_READ_COMPANY: 'employee.read.company',
  EMPLOYEE_MANAGE: 'employee.manage',
  REPORTING_ASSIGN: 'reporting.assign',

  // Attendance
  ATTENDANCE_READ_SELF: 'attendance.read.self',
  ATTENDANCE_READ_REPORTING_TEAM: 'attendance.read.reporting_team',
  ATTENDANCE_READ_DEPARTMENT: 'attendance.read.department',
  ATTENDANCE_READ_COMPANY: 'attendance.read.company',
  ATTENDANCE_RECORD_SELF: 'attendance.record.self',
  ATTENDANCE_MANAGE: 'attendance.manage',

  // Timesheets
  TIMESHEET_SUBMIT_SELF: 'timesheet.submit.self',
  TIMESHEET_APPROVE_ASSIGNED: 'timesheet.approve.assigned',
  TIMESHEET_READ_SELF: 'timesheet.read.self',
  TIMESHEET_READ_REPORTING_TEAM: 'timesheet.read.reporting_team',

  // Projects & Tasks
  PROJECT_CREATE: 'project.create',
  PROJECT_READ_ASSIGNED: 'project.read.assigned',
  PROJECT_MANAGE_ASSIGNED: 'project.manage.assigned',
  TASK_CREATE: 'task.create',
  TASK_ASSIGN: 'task.assign',
  TASK_READ_ASSIGNED: 'task.read.assigned',

  // Chat
  CHAT_READ_CONVERSATION: 'chat.read.conversation',
  CHAT_SEND_MESSAGE: 'chat.send.message',

  // Mail
  MAIL_READ_OWN_MAILBOX: 'mail.read.own_mailbox',
  MAIL_MANAGE_SHARED_MAILBOX: 'mail.manage.shared_mailbox',

  // HRMS & Payroll
  PAYROLL_READ: 'payroll.read',
  PAYROLL_MANAGE: 'payroll.manage',
  LEAVE_REQUEST_SELF: 'leave.request.self',
  LEAVE_APPROVE_ASSIGNED: 'leave.approve.assigned',

  // Audit & Settings
  AUDIT_READ: 'audit.read',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions];

/**
 * Checks if a set of user permissions contains the required permission
 */
export function hasPermission(
  userPermissions: readonly string[],
  requiredPermission: PermissionKey
): boolean {
  return userPermissions.includes(requiredPermission);
}
