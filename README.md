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
   - Create application endpoint (defaults `stage=SAVED`, set `last_touch_at`)
   - List applications endpoint (filter by stage, sort by `last_touch_at`)
   - Update application endpoint (company/role/link/notes)
   - Delete application endpoint (soft delete optional)
   - "Stale" query support (older than N days)
   - Applications API integration tests (owned rows only)
5. **Phase 4 — Workflow Engine (State Machine + Audit Trail)**
   - Stage enum + allowed transitions map
   - Transition endpoint (`PATCH /applications/:id/stage`)
   - Validate transitions server-side (reject invalid jumps)
   - Write `stage_events` row on every stage change
   - Auto-update `last_touch_at` + `stage_changed_at` on transitions
   - Workflow tests (valid transitions pass, invalid fail, audit created)
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


## 🚀 Quick Start

Want to get started quickly? Check out our [Quick Start Guide](./QUICKSTART.md) to have the app running in less than 10 minutes!

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get running in under 10 minutes
- **[Architecture Overview](./ARCHITECTURE.md)** - Technical architecture and design
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Axios** for API communication

### Backend
- **Spring Boot 3.2.1** with Java 17
- **Spring Data JPA** for database operations
- **PostgreSQL** driver for Supabase connection
- **Maven** for dependency management

### Database & Authentication
- **Supabase** - PostgreSQL database (accessed by the backend)
- **Backend** - Handles authentication via API endpoints

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

## Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 18+** and npm
- **Supabase Account** - [Sign up here](https://supabase.com)

## Setup Instructions

### 1. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to **Project Settings > Database**
3. Note down your database connection details
4. Go to **Project Settings > API**
5. Copy your project URL and anon public key

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Supabase credentials:
   ```
   SUPABASE_DB_URL=jdbc:postgresql://db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   SUPABASE_DB_USERNAME=postgres
   SUPABASE_DB_PASSWORD=your-database-password
   ```

4. Install dependencies and run:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /api/health` - Check backend status

### Items CRUD
- `GET /api/items` - Get all items
- `GET /api/items/{id}` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

## Features

### Current
- Basic items CRUD for API + UI scaffolding
- Backend connectivity checks

### Planned (Incremental)
1. **Applications**
   - `applications` table + REST endpoints
2. **Stage Workflow**
   - Valid transitions + stage events
3. **Tasks**
   - Task creation, due dates, completion
4. **Audit Log**
   - Event history for key actions
5. **Contacts & Interactions**
   - People + interaction logging

### Authentication
- Will be handled by backend API endpoints (JWT)

### CRUD Operations
- Create, Read, Update, Delete operations for items
- Real-time updates
- RESTful API design

### Database
- PostgreSQL database through Supabase
- Automatic schema migrations with Spring Data JPA
- Connection pooling and optimization

## Building for Production

### Backend
```bash
cd backend
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
cd frontend
npm run build
```

The production build will be in the `frontend/dist` directory.

## Development

### Backend Development
- Hot reload is enabled with Spring Boot DevTools
- Run tests: `mvn test`
- Check code style: Configure with your preferred linter

### Frontend Development
- Hot Module Replacement (HMR) enabled
- Run linter: `npm run lint`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Troubleshooting

### Backend Issues
- **Connection refused**: Ensure Supabase database credentials are correct
- **Port already in use**: Change port in `application.properties`

### Frontend Issues
- **Cannot connect to backend**: Verify `VITE_API_BASE_URL` is correct

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Learn More

- **[React Documentation](https://react.dev/)**
- **[Spring Boot Documentation](https://spring.io/projects/spring-boot)**
- **[Supabase Documentation](https://supabase.com/docs)**
- **[Vite Documentation](https://vitejs.dev/)**
- **[TypeScript Documentation](https://www.typescriptlang.org/)**

## Project Structure

```
dev/
├── backend/              # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/     # Java source code
│   │   │   └── resources/ # Configuration
│   │   └── test/         # Tests
│   └── pom.xml           # Maven config
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── package.json      # npm config
│
├── QUICKSTART.md         # Quick start guide
├── ARCHITECTURE.md       # Architecture docs
└── DEPLOYMENT.md         # Deployment guide
```

## Support

For detailed information:
- Setup issues: See [QUICKSTART.md](./QUICKSTART.md)
- Architecture questions: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- Deployment help: See [DEPLOYMENT.md](./DEPLOYMENT.md)
