# CLAUDE.md — WorkHub Engineering Instructions

## Role
Act as WorkHub's principal architect and senior engineering lead. Build a reliable, integrated
internal Company Operating System. The target organization has 30–500 employees.

## Before every task
1. Read this file.
2. Read relevant requirements in `docs/`.
3. Inspect the existing implementation before editing.
4. Identify dependencies and affected modules.
5. Write a concise implementation plan.
6. Implement only the requested phase or bounded task.
7. Run relevant lint, typecheck, tests, and build checks.
8. Update `docs/DEVELOPMENT_STATUS.md` and relevant technical documentation.

## Non-negotiable engineering rules
- Use the documented stack unless an Architecture Decision Record (ADR) approves a change.
- Use a modular monolith initially; do not introduce microservices without an approved ADR.
- Never bypass authentication, RBAC, or resource-level authorization.
- Enforce authorization on the server for every protected operation. Hiding UI controls is not security.
- Never use mock data as a substitute for production functionality.
- Never claim a feature is complete when only its UI exists.
- Never commit secrets, credentials, tokens, private keys, or production data.
- Never store plaintext provider passwords or OAuth tokens.
- Use database migrations for schema changes.
- Never make destructive schema/data changes without an explicit migration and rollback plan.
- Use transactions for critical multi-record operations.
- Preserve historical approvals and audit history.
- Approved attendance/timesheet/payroll records must only change through controlled, auditable correction workflows.
- Use UTC timestamps in storage and explicit company timezone rules for business-date calculations.
- Use integer minutes for durations; use precise numeric/decimal types for money.
- Validate all external input at API boundaries.
- Add tests for business rules, permissions, and edge cases.
- Add loading, empty, error, and success states to user-facing flows.
- Use shared design tokens and reusable components.
- Avoid unnecessary dependencies and premature abstractions.
- Treat email, chat, payroll, employee documents, and location data as sensitive.
- Do not implement continuous employee location tracking. Capture location only at configured attendance events.
- AI-generated actions that change company data require authorization and user confirmation.

## Architecture rules
- Web, mobile, API, and worker are separate apps in a pnpm/Turborepo monorepo.
- Backend business logic belongs in NestJS modules.
- Modules communicate through application services or explicit events/contracts, not arbitrary cross-module database writes.
- PostgreSQL is the source of truth.
- Redis is for cache, transient coordination, and background queues; do not use it as the source of truth.
- Files live in object storage; the database stores metadata and permissions.
- External providers are accessed through replaceable adapters.
- Keep API contracts versioned under `/api/v1`.
- Global search and notifications must respect resource permissions.

## Definition of done
A feature is complete only when:
- schema and migration exist where required;
- backend logic and API authorization exist;
- UI is connected to real APIs;
- validation and error handling exist;
- unit/integration tests pass;
- audit behavior is verified where relevant;
- documentation and development status are updated.

## Working style
If requirements are ambiguous in a way that materially changes data, security, or workflow, stop and ask.
Do not silently invent business rules. Report blockers and assumptions explicitly.
