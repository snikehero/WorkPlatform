import io
import json
from datetime import datetime
from urllib.parse import quote

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openpyxl import load_workbook

app = FastAPI(title="WorkPlatform Export API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHECK_CELL_MAP = {
    "hardware-general-cleaning": ("N12", "Q12"),
    "hardware-internal-components-cleaning": ("N13", "Q13"),
    "hardware-peripherals-validation": ("N14", "Q14"),
    "hardware-power-system-validation": ("N15", "Q15"),
    "hardware-network-card-validation": ("N16", "Q16"),
    "software-os-diagnosis-correction": ("N19", "Q19"),
    "software-os-driver-updates": ("N20", "Q20"),
    "software-system-files-cleanup": ("N21", "Q21"),
    "software-disk-optimization": ("N22", "Q22"),
    "software-antivirus-check": ("N23", "Q23"),
    "software-virus-definitions-update": ("N24", "Q24"),
    "software-service-pack-installation": ("N25", "Q25"),
    "software-ram-optimization": ("N26", "Q26"),
    "software-disk-capacity-optimization": ("N27", "Q27"),
    "software-authorized-software-policies": ("N28", "Q28"),
}


def _normalize_upper(value: str) -> str:
    return (value or "").strip().upper()


def _sanitize_token(value: str) -> str:
    source = _normalize_upper(value)
    return "".join(ch for ch in source if ch.isalnum() or ch == "-")


@app.post("/api/maintenance/export")
async def export_maintenance(template: UploadFile = File(...), payload: str = Form(...)):
    if not template.filename:
        raise HTTPException(status_code=400, detail="Template file is required")

    lower_name = template.filename.lower()
    if not (lower_name.endswith(".xlsx") or lower_name.endswith(".xlsm")):
        raise HTTPException(status_code=400, detail="Template must be an .xlsx or .xlsm file")

    try:
        record = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload JSON") from exc

    required_fields = [
        "id",
        "qr",
        "brand",
        "model",
        "user",
        "serialNumber",
        "consecutive",
        "maintenanceType",
        "maintenanceDate",
        "location",
        "responsibleName",
        "checks",
    ]
    for field in required_fields:
        if field not in record:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    maintenance_type = _normalize_upper(str(record["maintenanceType"]))
    if maintenance_type not in ("P", "C"):
        raise HTTPException(status_code=400, detail="maintenanceType must be P or C")

    brand = _normalize_upper(str(record["brand"]))
    model = _normalize_upper(str(record["model"]))
    qr = _normalize_upper(str(record["qr"]))
    user = _normalize_upper(str(record["user"]))
    serial_number = _normalize_upper(str(record["serialNumber"]))
    consecutive = _normalize_upper(str(record["consecutive"]))
    location = _normalize_upper(str(record["location"]))
    responsible_name = _normalize_upper(str(record["responsibleName"]))

    try:
        date_value = datetime.strptime(record["maintenanceDate"], "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="maintenanceDate must be YYYY-MM-DD") from exc

    template_bytes = await template.read()
    try:
        workbook = load_workbook(
            io.BytesIO(template_bytes),
            keep_vba=lower_name.endswith(".xlsm"),
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Could not open template workbook") from exc

    sheet = workbook[workbook.sheetnames[0]]

    # Header and key fields
    # Header and key fields (mapped to the provided xlsm template layout)
    sheet["L3"] = brand
    sheet["D5"] = qr
    sheet["D6"] = model
    sheet["S6"] = serial_number
    sheet["D7"] = user
    sheet["S7"] = date_value
    sheet["J8"] = responsible_name
    sheet["S8"] = location

    # Clear review and observation cells first to avoid stale template data.
    for reviewed_cell, observation_cell in CHECK_CELL_MAP.values():
        sheet[reviewed_cell] = ""
        sheet[observation_cell] = ""

    checks = record["checks"] if isinstance(record["checks"], list) else []
    for item in checks:
        check_id = item.get("id")
        mapping = CHECK_CELL_MAP.get(check_id)
        if not mapping:
            continue
        reviewed_cell, observation_cell = mapping

        if bool(item.get("checked")):
            sheet[reviewed_cell] = "X"
        observation = _normalize_upper(str(item.get("observation", "")))
        if observation:
            sheet[observation_cell] = observation

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    file_brand = _sanitize_token(brand) or "NA"
    file_model = _sanitize_token(model) or "NA"
    file_serial = _sanitize_token(serial_number) or "NA"
    file_consecutive = _sanitize_token(consecutive) or "0000"
    extension = ".xlsm" if lower_name.endswith(".xlsm") else ".xlsx"
    filename = f"TDC-{file_brand}_{file_model}_{file_serial}_{file_consecutive}{maintenance_type}{extension}"
    encoded_filename = quote(filename)
    content_disposition = (
        f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}"
    )

    media_type = (
        "application/vnd.ms-excel.sheet.macroEnabled.12"
        if extension == ".xlsm"
        else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    return StreamingResponse(
        output,
        media_type=media_type,
        headers={"Content-Disposition": content_disposition},
    )
