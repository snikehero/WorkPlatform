# WorkPlatform

WorkPlatform is a full-stack internal operations platform built with React + FastAPI + PostgreSQL.

Main modules:
- Authentication and role-based access (`admin`, `developer`, `user`)
- Tickets workflow
- Assets + asset lifecycle history
- Maintenance (Dashboard, Registry, Create)
- Projects, daily tasks, daily notes
- Knowledge base, notifications, team calendar

## Tech Stack

Frontend:
- React + TypeScript + Vite
- TailwindCSS

Backend:
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT auth

## Repository Structure

```text
.
|- src/                # Frontend app
|- backend/            # FastAPI backend
|- .github/workflows/  # CI/CD workflows
|- docker-compose.yml  # Local full stack (frontend + backend + postgres)
|- Dockerfile          # Frontend image (nginx static)
`- backend/Dockerfile  # Backend image
```

## Architecture Diagram

```mermaid
flowchart LR
  U[User Browser] -->|HTTP| FE[Frontend\nReact + Vite Build\nServed by Nginx]
  FE -->|REST API| BE[Backend API\nFastAPI + SQLAlchemy]
  BE -->|SQL| DB[(PostgreSQL)]

  FE -->|Auth Token| FE
  BE -->|JWT Validate| BE

  subgraph Maintenance
    FE -->|Upload template + payload| BE
    BE -->|Generate Excel| FE
  end
```

## Quick Start (Docker)

From repo root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
```

Set env vars:

```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/workplatform
JWT_SECRET=change-me
JWT_EXP_MINUTES=720
```

Run:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
npm install
npm run dev
```

## Environment Variables

Backend:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXP_MINUTES` (optional, default `720`)

Frontend (Vite build-time):
- `VITE_API_BASE`
- `VITE_MAINTENANCE_EXPORT_API`

Notes:
- If `VITE_API_BASE` is not set, frontend resolves dynamically to `http(s)://<current-host>:8000`.
- If `VITE_MAINTENANCE_EXPORT_API` is not set, frontend resolves dynamically to `http(s)://<current-host>:8000/api/maintenance/export`.

## Default Seed User

On first backend startup:
- Email: `admin@workplatform.local`
- Password: `123456`

Change this for non-local environments.

## Deployment (Docker / VM / LAN)

```bash
docker compose up -d --build
```

Ports:
- `8080` frontend
- `8000` backend
- `5432` postgres

LAN access example:
- `http://<host-ip>:8080`

## CI/CD (Current State)

Current workflow file:
- `.github/workflows/docker-publish.yml`

What it does today:
1. Triggers on push to `main`.
2. Checks out repo.
3. Sets up Docker Buildx.
4. Logs into Docker Hub using secrets:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
5. Builds and pushes image:
   - `snikehero/workplatform:latest`

Important current limitations:
- No automated tests in CI before push.
- No backend image push step (current workflow builds from repo root Dockerfile).
- Single `latest` tag strategy (no versioned tags).

## Useful Commands

Type check frontend:

```bash
npx tsc --noEmit
```

Run full stack:

```bash
docker compose up --build
```
