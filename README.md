# WorkHub — Starter Repository

WorkHub is an internal Company Operating System for a 30–500 employee organization.

This starter kit gives Claude Code / VS Code a documented product direction, architecture,
repository scaffold, development rules, and a local infrastructure baseline.

## Start here

1. Open this folder in VS Code.
2. Read `CLAUDE.md`.
3. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/ROADMAP.md`.
4. Install Node.js LTS, pnpm, Docker Desktop, and Git.
5. Copy `.env.example` to `.env` and fill local values.
6. Run `pnpm install`.
7. Run `docker compose up -d`.
8. Ask Claude Code to execute **Phase 0 only** from `docs/CLAUDE_EXECUTION_PLAN.md`.

Do not ask Claude to implement every module in one pass. Work phase-by-phase and review each
milestone before continuing.

## Current scaffold status

This is a starter scaffold, not a completed product. It intentionally contains no production
authentication, business APIs, or real integrations yet.

## Product decisions

- Internal company deployment first.
- Designed for 30–500 employees.
- Web: Next.js + TypeScript.
- Mobile: React Native + Expo.
- Backend: NestJS modular monolith.
- Database: PostgreSQL + Prisma.
- Cache/jobs: Redis + BullMQ.
- Real-time: WebSockets.
- Files: S3-compatible object storage.
- Email: WorkHub UI with existing providers through OAuth/API and SMTP/IMAP where appropriate.
- Warm ivory / orange minimal design direction.
