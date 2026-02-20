# WorkPlatform Context for ChatGPT Web

Last updated: 2026-02-20

Use this file as context when asking ChatGPT to help with this app.
Paste the relevant sections plus your task.

## 1) What this app is

WorkPlatform is an internal operations platform with:

- Auth + roles (`admin`, `developer`, `user`)
- Module-level access control (`personal`, `work`, `tickets`, `assets`, `admin`)
- Personal productivity (tasks, notes, projects, weekly review)
- Team features (calendar, notifications, knowledge base)
- Ticket workflow with SLA and evidence
- Asset inventory + asset event history
- Maintenance records + Excel export
- Admin users/people/module-access/audit logs

Tech stack:

- Frontend: React 19 + TypeScript + Vite + Tailwind v4 + React Router v7
- Backend: FastAPI + SQLAlchemy + PostgreSQL + JWT
- Deployment: Docker Compose (`frontend`, `backend`, `postgres`)

## 2) Repo structure

- `src/` frontend app
- `backend/` FastAPI app
- `docker-compose.yml` full stack local runtime
- `README.md` and `backend/README.md` setup docs

Frontend path alias:

- `@/*` -> `src/*` (`tsconfig.json`, `vite.config.ts`)

## 3) Runtime and config

Backend env vars:

- `DATABASE_URL`
- `JWT_SECRET` (must be >= 32 chars)
- `JWT_EXP_MINUTES` (default `720`)
- `ADMIN_BOOTSTRAP_PASSWORD` (required for initial admin seed)

Frontend env vars:

- `VITE_API_BASE` (defaults to `http(s)://<host>:8000`)
- `VITE_MAINTENANCE_EXPORT_API` (defaults to `http(s)://<host>:8000/api/maintenance/export`)

Default seed user on first backend startup:

- Email: `admin@workplatform.local`
- Password: value of `ADMIN_BOOTSTRAP_PASSWORD`

## 4) Frontend architecture

Entry point:

- `src/main.tsx` wraps app with `I18nProvider`, `ThemeProvider`, `ToastProvider`, `RouterProvider`

Routing:

- `src/router.tsx`
- Route guards:
  - `ProtectedRoute` (auth + optional module)
  - `TeamRoute` (auth + module + role must be `admin|developer`)
  - `AdminRoute` (admin role + admin module)

Layout and navigation:

- `src/components/layout/app-layout.tsx`
- Sidebar sections are persisted in localStorage
- Nav visibility is driven by role + module access map

State pattern:

- No Redux/Zustand; stores are plain module singletons
- API wrappers are in `src/stores/*` and use `apiRequest` from `src/lib/api.ts`
- Auth state persisted in localStorage and attached as bearer token by `apiRequest`

I18n:

- `src/i18n/i18n.tsx` + `src/i18n/translations.ts`
- Locales: `en`, `es`

## 5) Backend architecture

App bootstrap:

- `backend/main.py` creates tables on startup and runs schema patch SQL (`ALTER TABLE IF NOT EXISTS`, indexes, cleanup)
- No migration tool (like Alembic) currently; startup code handles schema drift

Routing:

- All API routes in `backend/api.py`
- Shared dependencies/helpers in `backend/auth.py`, `backend/logic.py`, `backend/models.py`, `backend/schemas.py`
- `backend/core.py` is a compatibility facade that re-exports internals

Auth:

- JWT `HS256`, token includes `sub`, `email`, `role`, `exp`
- Password hashing via `passlib` (`pbkdf2_sha256`)

Error model:

- Global exception handlers add normalized error body and `X-Request-ID`

## 6) Access control model

Roles:

- `admin`, `developer`, `user`

Modules:

- `personal`, `work`, `tickets`, `assets`, `admin`

Default module access:

- admin: all true
- developer: all true except admin=false
- user: personal/work/tickets=true, assets/admin=false

Backend checks use dependencies in `backend/logic.py`:

- `require_personal_access`, `require_work_access`, `require_tickets_access`, `require_assets_access`, `require_admin_access`
- team-only dependencies require role `admin|developer`

## 7) Core business rules

### Tickets

Statuses:

- `new`, `triaged`, `in_progress`, `waiting_user`, `blocked`, `resolved`, `closed`, `reopened`

Allowed transitions are enforced server-side (`validate_ticket_transition`).

Priority values:

- `low`, `medium`, `high`, `critical`

Category values:

- `printer`, `help`, `network`, `software`, `hardware`, `access`

SLA deadlines (hours):

- First response: low 24, medium 8, high 2, critical 1
- Resolution: low 72, medium 24, high 8, critical 4

Assignment:

- Admin can assign to admin/developer users
- Developer can only assign to self or unassign

Resolution workflow:

- Frontend `ticket-solution-page.tsx` enforces checklist (required process fields, min chars, evidence, resolution length) before resolving
- Backend still validates status transitions and evidence format (`data:image/*` for image payloads)

### Assets

Create asset:

- Backend auto-generates `assetTag` as `TDC-####` and QR as `TDC-YY-####-<A|B|C>`
- `status` must be `active|maintenance|retired|lost`
- Asset events are logged for create/update/delete

Maintenance linkage:

- When a maintenance record is created, backend tries to match asset by QR or serial and writes an asset event (`maintenance_recorded`)

### Maintenance

Record creation:

- `maintenanceType` must be `P` or `C`
- Frontend uppercases most maintenance fields before sending
- Checks come from fixed definitions in `src/lib/maintenance-checks.ts`

Excel export:

- Endpoint: `POST /api/maintenance/export`
- Requires auth, template file (`.xlsx`/`.xlsm`), and payload JSON
- Backend verifies record ownership and writes values/checks into mapped cells
- Filename format: `TDC-{BRAND}_{MODEL}_{SERIAL}_{CONSECUTIVE4}{TYPE}.{xlsx|xlsm}`

Template persistence:

- Frontend stores uploaded maintenance template in localStorage as base64 (`maintenance-template-store`)

### People and users

- Creating a person in admin also creates/links a `users` row
- Activation token (60 min) is issued so user sets password on `/activate?token=...`

### Audit logs

- Admin actions write audit records with actor, target, status, request id, payload
- Retention is 180 days by default; old rows are cleaned at startup
- Supports filtered list + CSV export

## 8) Important frontend files by concern

- Auth: `src/stores/auth-store.ts`, `src/pages/login-page.tsx`, `src/pages/activate-account-page.tsx`
- Route/access: `src/router.tsx`, `src/lib/module-access.ts`, `src/stores/module-access-store.ts`
- Tickets: `src/stores/ticket-store.ts`, `src/pages/ticket-solution-page.tsx`
- Assets: `src/stores/asset-store.ts`, `src/pages/asset-inventory-page.tsx`, `src/pages/asset-list-page.tsx`
- Maintenance: `src/components/maintenance/maintenance-form.tsx`, `src/stores/maintenance-store.ts`, `src/lib/maintenance-excel.ts`, `src/pages/maintenance-*.tsx`
- Admin: `src/stores/admin-store.ts`, `src/stores/people-store.ts`, `src/stores/admin-audit-store.ts`

## 9) Main backend endpoint groups

Auth/account:

- `/api/auth/register`, `/api/auth/login`, `/api/auth/activate`, `/api/auth/me`
- `/api/auth/change-password`, `/api/account/preferences`
- `/api/module-access/me`

Admin:

- `/api/admin/users*`
- `/api/admin/people*`
- `/api/admin/module-access*`
- `/api/admin/audit-logs*`

Personal/work:

- `/api/projects*`, `/api/tasks*`, `/api/notes*`
- `/api/team-events*`
- `/api/notifications*`
- `/api/knowledge-base*`

Tickets:

- `/api/tickets/mine*`
- `/api/tickets*` (team flows, assignment, events)

Assets/maintenance:

- `/api/assets*`, `/api/assets/{asset_id}/history`
- `/api/maintenance-records*`
- `/api/maintenance/export`

## 10) localStorage keys used

- `workplatform-auth`
- `workplatform-module-access`
- `workplatform-sidebar-open`
- `workplatform-sidebar-sections`
- `workplatform-maintenance-template`
- `workplatform-saved-view:<userEmail>:<viewId>`

## 11) Current constraints and caveats

- No backend migration framework yet; schema updates happen in startup code
- No test scripts in `package.json` right now
- Frontend enforces some workflow checks that backend does not fully duplicate (example: ticket resolve checklist strictness)
- Backend enforces canonical validation for auth, status transitions, role/module access, and payload shapes

## 12) Prompt template for ChatGPT Web

Copy/paste this and replace `{TASK}`:

```text
You are helping on a project called WorkPlatform (React+TS frontend, FastAPI backend, PostgreSQL).
Use this context as source of truth and suggest concrete code changes with file paths.
Prefer minimal diffs that preserve existing architecture and naming.
If backend data contracts change, include required frontend/store/type updates.
If frontend forms change, keep i18n keys and role/module access behavior consistent.
Task: {TASK}
```

