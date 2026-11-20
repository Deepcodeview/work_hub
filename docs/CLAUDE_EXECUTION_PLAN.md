# Claude Code Execution Plan

Execute one phase at a time. Do not automatically continue to the next phase.

## Phase 0 — Repository and infrastructure
1. Inspect repository.
2. Confirm runtime versions and package manager.
3. Create workspace apps/packages structure.
4. Configure TypeScript, lint, formatting, Turborepo.
5. Scaffold NestJS API, Next.js web, Expo mobile, worker.
6. Configure Prisma and PostgreSQL connection.
7. Configure Redis and local MinIO.
8. Add health checks and CI.
9. Verify local startup and tests.
10. Update development status.

## Phase 1 — Identity and organization
Implement authentication, users, employees, departments, teams, reporting history, RBAC,
invitations, sessions, audit. Add tests for authorization and reporting cycles.

## Phase 2 — Attendance and timesheets
Implement sessions, location event capture, breaks, policies, corrections, shifts, timesheets,
immutable submission versions, manager approval and correction workflows.

## Phase 3 — Projects and tasks
Implement project CRUD, memberships, roles, tasks, owners, collaborators, dependencies, comments,
activity, time logs and views.

## Phase 4 — Dashboards and notifications
Connect dashboards to real APIs. Add notification preferences, delivery, read state and reporting.

## Phase 5 — Chat
Implement conversations, membership authorization, messages, threads, reactions, receipts,
attachments, WebSocket delivery and reconnection.

## Phase 6 — Mail
Implement provider adapters, OAuth, secure token storage, folder/message sync, deduplication,
send, drafts, attachments, retries, provider webhooks and email-to-task.

## Phase 7 — Calendar, meetings, documents
Implement calendar events, attendees, reminders, managed video provider adapter, meeting notes,
action items, file storage, permissions and document versions.

## Phase 8 — HRMS and payroll
Implement onboarding, leave, employee documents, approvals and payroll with validated statutory
and accounting requirements.

## Phase 9 — Automation and AI
Implement event-driven rules, conditions, actions, execution logs, permission checks, authorized
retrieval and user-confirmed AI write operations.

## Required response after each phase
Report:
- files created/changed;
- migrations added;
- endpoints implemented;
- screens implemented;
- tests run and results;
- security/permission checks;
- known limitations;
- documentation updated;
- recommended next step.

Stop after the requested phase and wait for review.
