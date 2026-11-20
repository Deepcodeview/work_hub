# WorkHub System Architecture

## Architecture decision
Use a TypeScript monorepo with a modular monolith backend.

## Applications
- `apps/web`: Next.js web application.
- `apps/mobile`: React Native + Expo application.
- `apps/api`: NestJS REST and WebSocket API.
- `apps/worker`: background job processors.

## Shared packages
- `packages/ui`: shared web UI primitives where platform-compatible.
- `packages/design-tokens`: colors, typography, spacing.
- `packages/api-client`: typed API client.
- `packages/contracts`: request/response contracts.
- `packages/validation`: shared validation schemas.
- `packages/permissions`: permission keys and helpers.
- `packages/config`: shared non-secret configuration.

## Infrastructure
- PostgreSQL: source of truth.
- Redis: cache, queue, ephemeral coordination.
- BullMQ: background jobs.
- S3-compatible storage: file and attachment content.
- WebSockets: real-time chat and notifications.
- External providers: email, push, video.

## Backend module boundaries
Identity, Organization, Employees, Access Control, Attendance, Timesheets, Projects, Tasks,
Chat, Mail, Calendar, Meetings, Files, Documents, HRMS, Payroll, Approvals, Notifications,
Automation, Reports, Integrations, Audit.

Modules must not perform arbitrary writes into another module's tables. Use explicit application
services, contracts, or domain events.

## Data and security
- UUID primary keys.
- Foreign keys and database constraints.
- UTC `TIMESTAMPTZ` for instants.
- `DATE` for business dates.
- Integer minutes for work durations.
- Numeric/decimal for money.
- Encrypted provider credentials.
- Object storage for file contents.
- Resource-level authorization.
- Append-only audit events for critical actions.

## Deployment
Local: Docker Compose.
Production: managed PostgreSQL, Redis, object storage, application containers, worker containers,
TLS reverse proxy, monitoring, centralized logs, backups and recovery.
