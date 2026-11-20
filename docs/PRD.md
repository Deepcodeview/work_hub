# WorkHub Product Requirements Document

## 1. Product vision
WorkHub is an internal Company Operating System: one workspace for people, work, communication,
email, scheduling, documents, approvals, and company operations.

## 2. Deployment and scale
- Internal deployment for one company initially.
- Initial users: approximately 30–100.
- Architecture target: 30–500 employees.
- Web, Android, and iOS clients.
- Organization identifier retained on company-owned records to support clean data boundaries.

## 3. Product modules

### P0 — Foundation
- Authentication and sessions.
- User and employee directory.
- Departments, teams, designations.
- Reporting hierarchy and history.
- Roles, permissions, scoped authorization.
- Notifications and audit logging.

### P1 — Core work operations
- Attendance: web and mobile clock-in/out.
- Mobile GPS capture at attendance events; web location policy configurable.
- Breaks, shifts, holidays, corrections.
- Daily timesheets and manager approval.
- Projects, members, milestones.
- Tasks, subtasks, checklists, dependencies, comments, time logs.
- Employee, manager, department-head, and admin dashboards.

### P2 — Collaboration
- Direct messages and group conversations.
- Department/team/project channels.
- Threads, reactions, mentions, read receipts, file sharing.
- Documents and project file libraries.
- WorkHub Mail interface connected to existing providers.
- Calendar and events.

### P3 — Extended operations
- Meetings through managed video infrastructure.
- Leave and HRMS workflows.
- Payroll with appropriate statutory and accounting validation.
- Reusable approvals engine.
- Reports and exports.

### P4 — Intelligence
- Workflow automation.
- AI summaries and authorized search.
- AI-assisted task and meeting action extraction.
- AI write actions require confirmation and authorization.

## 4. Roles
- System Administrator.
- HR Administrator.
- Department Head.
- Reporting Manager.
- Project Manager.
- Finance.
- Employee.

Users can hold multiple roles. Roles are capabilities, not mutually exclusive employee identities.

## 5. Core business rules
1. Every active employee has one primary reporting manager, except explicitly configured top-level exceptions.
2. Reporting-manager changes are effective-dated and preserve historical approval responsibility.
3. Project manager and reporting manager are separate relationships.
4. Employees see only authorized projects and tasks.
5. Every task has one accountable owner; collaborators may be additional.
6. Attendance records represent presence; timesheets represent work performed.
7. Timesheet approval routes to the reporting manager captured at submission.
8. Approved records are corrected through versioned, audited workflows.
9. GPS is captured at configured attendance events, not continuously.
10. Email access is private to the mailbox owner unless an explicit shared-mailbox permission exists.
11. Global search must enforce the same permissions as direct resource access.
12. Critical actions create audit events.

## 6. Email strategy
Hybrid email:
- WorkHub provides its own web/mobile mail experience.
- Existing company mailboxes remain hosted by current providers initially.
- Provider adapters support Microsoft Graph, Gmail APIs, and generic SMTP/IMAP where supported.
- OAuth is preferred for Google and Microsoft accounts.
- SMTP is for outbound delivery; inbound mail requires provider APIs, IMAP, or inbound routing.
- Provider capability differences must be represented explicitly.
- No custom global mail server in initial releases.

## 7. Non-functional requirements
- Secure server-side authorization on every protected operation.
- UTC storage and explicit company timezone handling.
- Database transactions for critical workflows.
- Cursor pagination for high-volume messages and activity.
- Backups and tested restoration.
- Structured logs and correlation IDs.
- Accessible responsive UI.
- Automated unit, integration, and end-to-end tests.
- No production secrets in source control.
