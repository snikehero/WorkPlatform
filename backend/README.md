# Maintenance Export API

This service exports maintenance records into your Excel template while preserving template design using `openpyxl`.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoint

- `POST /api/maintenance/export`
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
