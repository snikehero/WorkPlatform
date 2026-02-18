# WorkPlatform

WorkPlatform is a full-stack internal operations platform built with React + FastAPI + PostgreSQL.

It includes modules for:
- Authentication and role-based access (`admin`, `developer`, `user`)
- Tickets and ticket workflow
- Assets and asset lifecycle history
- Asset maintenance (dashboard, registry, create)
- Projects, daily tasks, daily notes
- Knowledge base, notifications, team calendar

## Tech Stack

Frontend:
- React + TypeScript + Vite
- TailwindCSS + custom UI components

Backend:
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT auth

## Repository Structure

```text
.
+- src/                # Frontend app
+- backend/            # FastAPI backend
+- docker-compose.yml  # Full local stack (frontend + backend + postgres)
+- Dockerfile          # Frontend container image
+- backend/Dockerfile  # Backend container image
```

## Quick Start (Docker)

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

## Local Development (without Docker)

### 1) Backend

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

Run backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
npm install
npm run dev
```

Frontend dev server is configured for LAN access (`host: true`).

## Environment Variables

Backend:
- `DATABASE_URL` (required in real deployments)
- `JWT_SECRET` (required in real deployments)
- `JWT_EXP_MINUTES` (optional, default `720`)

Frontend (build-time Vite vars):
- `VITE_API_BASE`
- `VITE_MAINTENANCE_EXPORT_API`

Notes:
- If `VITE_API_BASE` is not set, frontend resolves API base dynamically as `http(s)://<current-host>:8000`.
- If `VITE_MAINTENANCE_EXPORT_API` is not set, it resolves dynamically as `http(s)://<current-host>:8000/api/maintenance/export`.

## Default Seed User

On first backend startup, the app seeds:
- Email: `admin@workplatform.local`
- Password: `123456`

Change this immediately in non-local environments.

## Deployment Guide

## Option A: Render.com (recommended)

Use 3 services:
1. PostgreSQL (Render managed Postgres)
2. Backend (Web Service)
3. Frontend (Static Site)

### Backend Service (Render Web Service)

Root directory: `backend`

Build command:
```bash
pip install -r requirements.txt
```

Start command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Required env vars:
- `DATABASE_URL` = Render Postgres internal/external URL (use external format supported by `psycopg`)
- `JWT_SECRET` = strong secret
- `JWT_EXP_MINUTES` = optional (e.g. `720`)

### Frontend Service (Render Static Site)

Root directory: repository root

Build command:
```bash
npm ci && npm run build
```

Publish directory:
```bash
dist
```

Required env vars (build-time):
- `VITE_API_BASE=https://<your-backend-service>.onrender.com`
- `VITE_MAINTENANCE_EXPORT_API=https://<your-backend-service>.onrender.com/api/maintenance/export`

Important:
- Do not rely on Render IP addresses.
- Use the Render service URL (or custom domain) for backend references.

## Option B: Docker on VM / Local Server

```bash
docker compose up -d --build
```

Open ports:
- `8080` (frontend)
- `8000` (backend)
- `5432` (postgres, optional to expose publicly)

For LAN access, use your host IP:
- `http://<host-ip>:8080`

## API and CORS

Backend currently allows all origins (`allow_origins=["*"]`) for simplicity.
For production hardening, restrict this to known frontend domains.

## Current Maintenance Module Pages

- `Maintenance Dashboard`: next/upcoming due maintenance
- `Maintenance Registry`: all maintenance records + Excel export
- `Create Maintenance`: maintenance form entry

Routes:
- `/maintenance/dashboard`
- `/maintenance/registry`
- `/maintenance/create`

## Useful Commands

Type check frontend:
```bash
npx tsc --noEmit
```

Run full stack:
```bash
docker compose up --build
```

## License

Internal project. Add your organization's license policy if required.
