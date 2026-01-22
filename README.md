# Job Application Tracker

A backend-first internal tool for managing a job search as an operations workflow, built with **React**, **Spring Boot**, and **Supabase**.


## Backend Product Direction (Incremental)

1. **Phase 0 — Repo + Guardrails (Foundation)**
   - X Init backend project + tooling
   - X Env config + settings module (`DATABASE_URL`, `JWT_SECRET`, etc.)
   - X Docker Compose for Postgres + local dev
   - X DB migration framework + initial migration setup
   - X Lint/format + pre-commit hooks
   - X README with local setup + runbook
2. **Phase 1 — Data Model (Schema-First, No Auth Yet)**
   - X Applications table (core fields + timestamps)
   - X Tasks table (`application_id` FK + `due_at` + status)
   - X Stage events table (`from_stage`/`to_stage` + note + actor)
   - X Constraints + enums for stage and task status
   - X Indexes for `due_at`, `stage`, `last_touch_at`, `user_id`
   - X Seed minimal dev data for local testing
3. **Phase 2 — Auth + Ownership Enforcement (Non-Negotiable)**
   - X Users table + basic user model
   - X Signup + password hashing (or provider hookup if using Supabase Auth)
   - X Login endpoint returning JWT
   - X Auth middleware (extract/verify JWT)
   - X Row ownership enforcement (`user_id` scoped queries everywhere)
   - X Auth tests (invalid token, cross-user access blocked)
4. **Phase 3 — Applications API (CRUD + Operational Fields)**
   - X Create application endpoint (defaults `stage=SAVED`, set `last_touch_at`)
   - X List applications endpoint (filter by stage, sort by `last_touch_at`)
   - X Update application endpoint (company/role/link/notes)
   - X Delete application endpoint (soft delete optional)
   - X "Stale" query support (older than N days)
   - X Applications API integration tests (owned rows only)
5. **Phase 4 — Workflow Engine (State Machine + Audit Trail)**
   - X Stage enum + allowed transitions map
   - X Transition endpoint (`PATCH /applications/:id/stage`)
   - X Validate transitions server-side (reject invalid jumps)
   - X Write `stage_events` row on every stage change
   - X Auto-update `last_touch_at` + `stage_changed_at` on transitions
   - X Workflow tests (valid transitions pass, invalid fail, audit created)
6. **Phase 5 — Tasks & Follow-ups (Operational Layer)**
   - Create task for application (title, `due_at`, notes)
   - List tasks for application endpoint
   - Mark task done/undone + `completed_at` timestamps
   - Global "due today / this week / overdue" endpoints
   - Task reminders metadata (`snooze_until` or `follow_up_after`)
   - Task query tests (timezone-safe due windows, overdue correctness)
7. **Phase 6 — Audit Log as a First-Class Feature**
   - Generic `audit_events` table (type, entity, payload JSON)
   - Emit audit event on stage transition
   - Emit audit event on task create/complete
   - Audit feed endpoint (latest events, pagination)
   - Correlation/request ID logging to tie actions to events
   - Audit feed tests (ordering + ownership enforcement)
8. **Phase 7 — Dashboards (The "Product" Endpoints)**
   - Dashboard summary endpoint (counts by stage + overdue tasks)
   - Stale applications endpoint (no touch > N days)
   - "Next actions" endpoint (tasks due soon + apps needing follow-up)
   - Activity endpoint (last 7/30 days transitions + completions)
   - Optimize dashboard queries (indexes + explain + tune)
   - Dashboard snapshot tests (stable aggregates)
9. **Phase 8 — Hardening (Real-World Backend Work)**
   - Consistent error format + global exception handler
   - Input validation + request schemas (reject garbage early)
   - Rate limit auth + sensitive endpoints
   - CORS config + security headers
   - Structured logging + healthcheck + metrics endpoint
   - End-to-end test suite (SAVED → OFFER happy path)
10. **Phase 9 — Deploy (Proof It Runs Outside Your Laptop)**
   - Production config (envs, DB SSL, JWT rotation plan)
   - Migration run step in startup pipeline
   - Deploy backend (Render/Railway/Fly) + managed Postgres
   - CI pipeline (lint, tests, migrations check)
   - Seed/admin script for your own account
   - Deployment guide + API docs (OpenAPI/Swagger)

## Frontend Product Direction (Incremental)

1. **Phase 0 — UI Foundation**
   - X Vite + React + TypeScript setup
   - X Basic routing/layout shell
   - X API client wiring + env config
2. **Phase 1 — Core Views (Read-Only)**
   - Dashboard summary cards (counts by stage + overdue tasks)
   - Applications list (stage filter + sort by last touch)
   - Application detail page (notes + history sections)
3. **Phase 2 — Auth UX**
   - Signup + login screens
   - Store JWT securely (memory + refresh on reload)
   - Guarded routes + logout flow
4. **Phase 3 — CRUD Flows**
   - Create application form
   - Edit application fields + notes
   - Delete (or archive) application action
5. **Phase 4 — Workflow UI**
   - Stage transition controls with validation messages
   - Stage history timeline (stage events)
   - Auto-update last touch indicator
6. **Phase 5 — Tasks & Follow-ups**
   - Create/edit tasks for application
   - Task list filters (due today/this week/overdue)
   - Mark done/undone with optimistic updates
7. **Phase 6 — Audit & Activity**
   - Activity feed (latest transitions + task events)
   - Detail view per event (actor + note)
8. **Phase 7 — Dashboards (Product UI)**
   - Stale applications view
   - Next actions panel (tasks due soon + apps needing follow-up)
   - Activity trends (7/30 days)
9. **Phase 8 — Hardening**
   - Form validation + error states
   - Empty states + skeleton loading
   - Performance tuning for large lists
10. **Phase 9 — Release**
   - Build + deploy frontend
   - CI checks (lint + tests)
   - UI docs + basic usage guide


## Quick Start

Get running fast with the Make targets:

```bash
make backend-setup
make backend-run
make frontend-setup
make frontend-run
```

For a guided walkthrough, see [QUICKSTART.md](./QUICKSTART.md).

## Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Prerequisites

- Java 17+
- Maven 3.6+
- Node.js 18+ and npm
- Supabase account

## Configuration

### Supabase
1. Create a project at [Supabase](https://supabase.com)
2. Copy database connection details from **Project Settings > Database**

### Backend
1. `cd backend`
2. `cp .env.example .env`
3. Set:
   ```
   SUPABASE_DB_URL=jdbc:postgresql://db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   SUPABASE_DB_USERNAME=postgres
   SUPABASE_DB_PASSWORD=your-database-password
   ```
4. Run: `make backend-run`

### Frontend
1. `cd frontend`
2. `cp .env.example .env`
3. Set:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
4. Run: `make frontend-run`

## Make Targets

- `make backend-setup` install backend dependencies
- `make backend-run` run backend dev server
- `make backend-test` run backend tests
- `make backend-build` build backend jar
- `make frontend-setup` install frontend dependencies
- `make frontend-run` run frontend dev server
- `make frontend-lint` lint frontend
- `make frontend-build` build frontend

## API Endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/{id}`
- `PATCH /api/applications/{id}/stage`
- `DELETE /api/applications/{id}`
- `POST /api/applications/{id}/tasks`
- `GET /api/applications/{id}/tasks`
- `PATCH /api/tasks/{id}/status`

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Axios

### Backend
- Spring Boot 3.2.1 (Java 17)
- Spring Data JPA
- PostgreSQL (Supabase)

## Project Structure

```
dev/
├── backend/              # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/dev/backend/
│   │   │   │   ├── config/       # Configuration classes
│   │   │   │   ├── controller/   # REST controllers
│   │   │   │   ├── model/        # Entity models
│   │   │   │   ├── repository/   # JPA repositories
│   │   │   │   └── service/      # Business logic
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
└── frontend/             # React frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── lib/          # Library configurations
    │   ├── pages/        # Page components
    │   ├── services/     # API service layers
    │   └── types/        # TypeScript type definitions
    └── package.json
```

## Build & Test

```bash
make backend-test
make backend-build
make frontend-lint
make frontend-build
```

## Troubleshooting

- Connection refused: verify Supabase credentials and backend port.
- Cannot connect to backend: confirm `VITE_API_BASE_URL`.

## License

MIT

## Contributing

Pull requests welcome.

## Support

- Setup: [QUICKSTART.md](./QUICKSTART.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)
