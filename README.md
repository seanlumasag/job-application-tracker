# Job Application Tracker

A full-stack operations dashboard for managing a job search with workflow automation, task follow-ups, and analytics.

## Demo

[Live Site](https://job-application-tracker-seanlumasag.vercel.app)


## Features

- JWT-based auth with refresh flow and ownership-scoped data
- Application pipeline with stage transitions and audit trail
- Task system with due-today/this-week/overdue views
- Dashboard summaries for stage counts, stale apps, and activity trends
- API health, metrics, and structured validation/error handling

## Tech Stack (and why)

### Backend
- Spring Boot 3 (Java 17) — mature ecosystem, strong layering for service logic
- PostgreSQL (via Supabase) — relational integrity for applications, tasks, and stage events
- Spring Data JPA — rapid CRUD with explicit domain models

### Frontend
- React + TypeScript — predictable UI state with type-safe models
- Vite — fast local DX and build times
- Axios — clear API client boundaries

### Infra/DevEx
- Docker Compose — reproducible local backend/dev DB setup
- Makefile — one-command developer workflows

## Architecture

```
Browser → React UI → Spring Boot API → Postgres (Supabase)
                            ↓
                         Audit + Tasks
```

Flow overview:
- Frontend calls REST endpoints for auth, apps, tasks, and dashboards
- API enforces ownership, validation, and workflow rules
- Postgres stores core workflow entities and audit events

## Getting Started

Quick start via Make targets:

```bash
make backend-setup
make backend-run
make frontend-setup
make frontend-run
```

## Configuration

### Backend (Supabase)
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

## Usage

1. Sign up and log in
2. Create a job application
3. Move it through pipeline stages
4. Add and complete follow-up tasks
5. Review dashboard insights (stale apps, next actions, activity)

## Testing

```bash
make backend-test
make frontend-lint
```

## Design Decisions

- Chose Postgres/Supabase over NoSQL for strict relational constraints between applications, tasks, and stage events.
- Used JWT auth to keep the API stateless and friendly to multiple clients.
- Added audit events early to support traceability for workflow changes.



## API Endpoints (high level)

Auth: signup/login/refresh/logout/MFA  
Applications: CRUD + stage transitions  
Tasks: create, update status, due windows  
Dashboards: summary, stale, next actions, activity  
System: health, metrics