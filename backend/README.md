# WorkPlatform API

This service provides:

- JWT authentication
- Postgres-backed CRUD APIs for projects, tasks, notes, team events, maintenance records
- Maintenance Excel export using `openpyxl` while preserving template design

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/workplatform
set JWT_SECRET=your-strong-secret-with-32-or-more-characters
set ADMIN_BOOTSTRAP_PASSWORD=your-initial-admin-password
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Default seeded admin:

- email: `admin@workplatform.local`
- password: value of `ADMIN_BOOTSTRAP_PASSWORD`

## Endpoint

- `POST /api/maintenance/export` (requires auth)
- multipart form fields:
  - `template`: `.xlsx` or `.xlsm` template file
  - `payload`: JSON string with `MaintenanceRecord` data

Frontend expects this API on:

- `http://localhost:8000/api/maintenance/export` by default
- or `VITE_MAINTENANCE_EXPORT_API` env var

## Docker Compose

From repo root:

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Export API: `http://localhost:8000/api/maintenance/export`
