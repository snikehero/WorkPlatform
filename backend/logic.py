import logging
import json
import re
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

try:
    from .auth import get_current_user, get_db
    from .models import (
        Asset,
        AssetEvent,
        AuditLog,
        KnowledgeArticle,
        MaintenanceRecord,
        Note,
        Notification,
        Person,
        Project,
        SessionLocal,
        Task,
        TeamEvent,
        Ticket,
        TicketEvent,
        User,
        RoleModuleAccess,
        UserRole,
    )
    from .schemas import (
        AssetEventOut,
        AssetOut,
        AuditLogOut,
        KnowledgeArticleOut,
        MaintenanceCheckPayload,
        MaintenanceRecordOut,
        NoteOut,
        NotificationOut,
        PersonOut,
        ProjectOut,
        TaskOut,
        TeamEventOut,
        TicketEventOut,
        TicketEvidenceOut,
        TicketOut,
    )
except ImportError:
    from auth import get_current_user, get_db
    from models import (
        Asset,
        AssetEvent,
        AuditLog,
        KnowledgeArticle,
        MaintenanceRecord,
        Note,
        Notification,
        Person,
        Project,
        SessionLocal,
        Task,
        TeamEvent,
        Ticket,
        TicketEvent,
        User,
        RoleModuleAccess,
        UserRole,
    )
    from schemas import (
        AssetEventOut,
        AssetOut,
        AuditLogOut,
        KnowledgeArticleOut,
        MaintenanceCheckPayload,
        MaintenanceRecordOut,
        NoteOut,
        NotificationOut,
        PersonOut,
        ProjectOut,
        TaskOut,
        TeamEventOut,
        TicketEventOut,
        TicketEvidenceOut,
        TicketOut,
    )

UNASSIGNED_USER_LABEL = "Unassigned"
MODULE_NAMES: tuple[str, ...] = ("personal", "work", "tickets", "assets", "admin")
AUDIT_RETENTION_DAYS = 180
AUDIT_PAYLOAD_STR_MAX = 500
AUDIT_PAYLOAD_JSON_MAX = 4000

logger = logging.getLogger(__name__)

DEFAULT_ROLE_MODULE_ACCESS: dict[str, dict[str, bool]] = {
    UserRole.admin.value: {
        "personal": True,
        "work": True,
        "tickets": True,
        "assets": True,
        "admin": True,
    },
    UserRole.developer.value: {
        "personal": True,
        "work": True,
        "tickets": True,
        "assets": True,
        "admin": False,
    },
    UserRole.user.value: {
        "personal": True,
        "work": True,
        "tickets": True,
        "assets": False,
        "admin": False,
    },
}


def parse_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date must be YYYY-MM-DD") from exc


def parse_optional_date(value: str | None) -> date | None:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    return parse_date(raw)


def parse_tags(raw: str) -> list[str]:
    if not raw.strip():
        return []
    return [item for item in (segment.strip() for segment in raw.split(",")) if item]


def serialize_tags(items: list[str]) -> str:
    normalized: list[str] = []
    seen: set[str] = set()
    for item in items:
        value = item.strip()
        if not value:
            continue
        lowered = value.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        normalized.append(value)
    return ",".join(normalized)


DEPARTMENT_OPTIONS: tuple[str, ...] = (
    "Direccion",
    "Administracion",
    "Comercial",
    "Capital Humano",
    "Calidad",
    "Compras",
    "Automatizacion",
    "Diseño Electrico",
    "HMI",
    "BMS",
    "Mantenimiento",
    "Construccion",
    "Desarrollo",
    "Electricidad y Fuerza",
    "Administracion de Proyectos",
    "Past Employee",
)

TICKET_STATUS_VALUES: tuple[str, ...] = (
    "new",
    "triaged",
    "in_progress",
    "waiting_user",
    "blocked",
    "resolved",
    "closed",
    "reopened",
)
TICKET_ACTIVE_STATUSES: tuple[str, ...] = ("new", "triaged", "in_progress", "waiting_user", "blocked", "reopened")
TICKET_RESOLUTION_STATUSES: tuple[str, ...] = ("resolved", "closed")
TICKET_TRANSITIONS: dict[str, set[str]] = {
    "new": {"triaged", "in_progress", "blocked", "resolved"},
    "triaged": {"in_progress", "waiting_user", "blocked", "resolved"},
    "in_progress": {"waiting_user", "blocked", "resolved"},
    "waiting_user": {"in_progress", "blocked", "resolved"},
    "blocked": {"triaged", "in_progress", "waiting_user", "resolved"},
    "resolved": {"closed", "reopened"},
    "closed": {"reopened"},
    "reopened": {"triaged", "in_progress", "waiting_user", "blocked", "resolved"},
}
TICKET_PRIORITY_VALUES: tuple[str, ...] = ("low", "medium", "high", "critical")
TICKET_CATEGORY_VALUES: tuple[str, ...] = ("printer", "help", "network", "software", "hardware", "access")
TICKET_FIRST_RESPONSE_SLA_HOURS: dict[str, int] = {"low": 24, "medium": 8, "high": 2, "critical": 1}
TICKET_RESOLUTION_SLA_HOURS: dict[str, int] = {"low": 72, "medium": 24, "high": 8, "critical": 4}


def normalize_department(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return DEPARTMENT_OPTIONS[0]
    normalized = raw.casefold()
    for option in DEPARTMENT_OPTIONS:
        if option.casefold() == normalized:
            return option
    allowed = "|".join(DEPARTMENT_OPTIONS)
    raise HTTPException(status_code=400, detail=f"department must be one of: {allowed}")


def build_next_asset_tag(db: Session) -> str:
    tags = db.scalars(select(Asset.asset_tag)).all()
    highest = 0
    pattern = re.compile(r"^TDC-(\d{4,})$", re.IGNORECASE)
    for tag in tags:
        match = pattern.match((tag or "").strip())
        if not match:
            continue
        value = int(match.group(1))
        if value > highest:
            highest = value
    return f"TDC-{highest + 1:04d}"


def normalize_qr_class(value: str | None) -> str:
    qr_class = (value or "A").strip().upper()
    if qr_class not in ("A", "B", "C"):
        raise HTTPException(status_code=400, detail="qrClass must be A|B|C")
    return qr_class


def build_qr_code_from_asset_tag(asset_tag: str, qr_class: str) -> str:
    tag_match = re.match(r"^TDC-(\d{4,})$", (asset_tag or "").strip(), flags=re.IGNORECASE)
    if not tag_match:
        raise HTTPException(status_code=400, detail="assetTag must match TDC-####")
    consecutive = int(tag_match.group(1))
    current_year = datetime.now(timezone.utc).year % 100
    year_segment = f"{current_year:02d}"
    return f"TDC-{year_segment}-{consecutive:04d}-{qr_class}"


def normalize_login_identity(value: str) -> str:
    raw = (value or "").strip().lower()
    if not raw:
        raise HTTPException(status_code=400, detail="Email/username is required")
    if "@" in raw:
        return raw
    return f"{raw}@workplatform.local"


def username_from_email(value: str) -> str:
    email = normalize_login_identity(value)
    return email.split("@", 1)[0].upper()


def to_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def get_request_id(request: Request | None) -> str:
    if request is None:
        return str(uuid.uuid4())
    value = getattr(request.state, "request_id", None)
    return str(value) if value else str(uuid.uuid4())


def get_request_ip(request: Request | None) -> str | None:
    if request is None or request.client is None:
        return None
    return request.client.host


def _truncate_text(value: str, max_len: int = AUDIT_PAYLOAD_STR_MAX) -> str:
    if len(value) <= max_len:
        return value
    return f"{value[:max_len]}..."


def _sanitize_audit_payload(value: object, depth: int = 0) -> object:
    if depth > 4:
        return "[depth-truncated]"
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str):
        return _truncate_text(value)
    if isinstance(value, dict):
        output: dict[str, object] = {}
        for key, item in value.items():
            output[_truncate_text(str(key), 80)] = _sanitize_audit_payload(item, depth + 1)
        return output
    if isinstance(value, list):
        return [_sanitize_audit_payload(item, depth + 1) for item in value[:30]]
    return _truncate_text(str(value))


def sanitize_audit_payload(payload: dict[str, object] | None) -> str:
    normalized = _sanitize_audit_payload(payload or {})
    raw = json.dumps(normalized, ensure_ascii=True)
    if len(raw) <= AUDIT_PAYLOAD_JSON_MAX:
        return raw
    preview = _truncate_text(raw, AUDIT_PAYLOAD_JSON_MAX - 64)
    return json.dumps({"truncated": True, "preview": preview}, ensure_ascii=True)


def diff_fields(before: dict[str, object], after: dict[str, object]) -> dict[str, dict[str, object]]:
    changed: dict[str, dict[str, object]] = {}
    for key in sorted(set(before.keys()) | set(after.keys())):
        previous = before.get(key)
        current = after.get(key)
        if previous != current:
            changed[key] = {"before": previous, "after": current}
    return changed


def write_audit_log(
    db: Session,  # noqa: ARG001
    *,
    actor: User | None,
    action: str,
    target_type: str,
    target_id: str | None,
    status: str,
    payload: dict[str, object] | None,
    request_id: str,
    ip_address: str | None,
) -> None:
    try:
        with SessionLocal() as audit_db:
            audit_db.add(
                AuditLog(
                    actor_user_id=actor.id if actor else None,
                    actor_email=actor.email if actor else "anonymous",
                    actor_role=actor.role if actor else "anonymous",
                    action=action,
                    target_type=target_type,
                    target_id=target_id,
                    status=status,
                    request_id=request_id,
                    ip_address=ip_address,
                    payload_json=sanitize_audit_payload(payload),
                    retention_until=datetime.now(timezone.utc) + timedelta(days=AUDIT_RETENTION_DAYS),
                )
            )
            audit_db.commit()
    except Exception:
        logger.exception("Audit write failed (request_id=%s, action=%s)", request_id, action)


def normalize_assigned_user(value: str | None) -> str:
    assigned = (value or "").strip()
    return assigned if assigned else UNASSIGNED_USER_LABEL


def normalize_ticket_category(value: str) -> str:
    category = (value or "").strip().lower()
    if category not in TICKET_CATEGORY_VALUES:
        allowed = "|".join(TICKET_CATEGORY_VALUES)
        raise HTTPException(status_code=400, detail=f"category must be {allowed}")
    return category


def normalize_ticket_priority(value: str) -> str:
    priority = (value or "").strip().lower()
    if priority not in TICKET_PRIORITY_VALUES:
        allowed = "|".join(TICKET_PRIORITY_VALUES)
        raise HTTPException(status_code=400, detail=f"priority must be {allowed}")
    return priority


def normalize_ticket_status(value: str) -> str:
    status_value = (value or "").strip().lower()
    if status_value not in TICKET_STATUS_VALUES:
        allowed = "|".join(TICKET_STATUS_VALUES)
        raise HTTPException(status_code=400, detail=f"status must be {allowed}")
    return status_value


def validate_ticket_transition(current: str, target: str) -> None:
    if current == target:
        return
    allowed = TICKET_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(status_code=400, detail=f"invalid transition {current}->{target}")


def calculate_ticket_deadlines(priority: str, created_at: datetime) -> tuple[datetime, datetime]:
    first_due = created_at + timedelta(hours=TICKET_FIRST_RESPONSE_SLA_HOURS[priority])
    resolution_due = created_at + timedelta(hours=TICKET_RESOLUTION_SLA_HOURS[priority])
    return first_due, resolution_due


def compute_ticket_sla_state(ticket: Ticket) -> str:
    if ticket.status in TICKET_RESOLUTION_STATUSES:
        return "completed"
    now = datetime.now(timezone.utc)
    due = ticket.resolution_due_at
    if due is None:
        return "on_track"
    if due <= now:
        return "breached"
    if due <= now + timedelta(hours=2):
        return "at_risk"
    return "on_track"


def log_ticket_event(db: Session, ticket: Ticket, actor_id: str | None, event_type: str, payload: dict[str, object] | None = None) -> None:
    event = TicketEvent(
        ticket_id=ticket.id,
        actor_id=actor_id,
        event_type=event_type,
        payload_json=json.dumps(payload or {}),
    )
    db.add(event)


def log_asset_event(db: Session, asset_id: str, actor_id: str | None, event_type: str, payload: dict[str, object] | None = None) -> None:
    event = AssetEvent(
        asset_id=asset_id,
        actor_id=actor_id,
        event_type=event_type,
        payload_json=json.dumps(payload or {}),
    )
    db.add(event)


def validate_assignment_permission(current_user: User, assignee_id: str | None) -> None:
    if current_user.role == UserRole.admin.value:
        return
    if current_user.role == UserRole.developer.value:
        if assignee_id is None or assignee_id == current_user.id:
            return
        raise HTTPException(status_code=403, detail="Developers can only assign tickets to themselves")
    raise HTTPException(status_code=403, detail="Only admin or developer can assign tickets")


def normalize_module_name(module_name: str) -> str:
    normalized = (module_name or "").strip().lower()
    if normalized not in MODULE_NAMES:
        allowed = "|".join(MODULE_NAMES)
        raise HTTPException(status_code=400, detail=f"module must be {allowed}")
    return normalized


def normalize_role_name(role_name: str) -> str:
    normalized = (role_name or "").strip().lower()
    if normalized not in (UserRole.admin.value, UserRole.developer.value, UserRole.user.value):
        allowed = f"{UserRole.admin.value}|{UserRole.developer.value}|{UserRole.user.value}"
        raise HTTPException(status_code=400, detail=f"role must be {allowed}")
    return normalized


def default_role_module_access(role_name: str) -> dict[str, bool]:
    role_key = normalize_role_name(role_name)
    defaults = DEFAULT_ROLE_MODULE_ACCESS.get(role_key)
    if defaults is None:
        return {module: True for module in MODULE_NAMES}
    return {module: bool(defaults.get(module, True)) for module in MODULE_NAMES}


def get_role_module_access_map(db: Session, role_name: str) -> dict[str, bool]:
    role_key = normalize_role_name(role_name)
    result = default_role_module_access(role_key)
    rows = db.scalars(select(RoleModuleAccess).where(RoleModuleAccess.role == role_key)).all()
    for row in rows:
        if row.module in MODULE_NAMES:
            result[row.module] = bool(row.enabled)
    if role_key == UserRole.admin.value:
        # Safety: never let admins lose access to the admin module.
        result["admin"] = True
    return result


def ensure_module_access(current_user: User, db: Session, module_name: str) -> None:
    normalized_module = normalize_module_name(module_name)
    permissions = get_role_module_access_map(db, current_user.role)
    if not permissions.get(normalized_module, True):
        raise HTTPException(status_code=403, detail=f"Module '{normalized_module}' is disabled for role '{current_user.role}'")


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="Admin role required")
    return current_user


def require_developer_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.admin.value, UserRole.developer.value):
        raise HTTPException(status_code=403, detail="Developer or admin role required")
    return current_user


def require_admin_access(current_user: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "admin")
    return current_user


def require_personal_access(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "personal")
    return current_user


def require_work_access(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "work")
    return current_user


def require_tickets_access(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "tickets")
    return current_user


def require_assets_access(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "assets")
    return current_user


def require_team_work_access(current_user: User = Depends(require_developer_or_admin), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "work")
    return current_user


def require_team_personal_access(current_user: User = Depends(require_developer_or_admin), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "personal")
    return current_user


def require_team_tickets_access(current_user: User = Depends(require_developer_or_admin), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "tickets")
    return current_user


def require_team_assets_access(current_user: User = Depends(require_developer_or_admin), db: Session = Depends(get_db)) -> User:
    ensure_module_access(current_user, db, "assets")
    return current_user


def project_to_out(project: Project) -> ProjectOut:
    return ProjectOut(id=project.id, name=project.name, description=project.description, createdAt=to_iso(project.created_at))


def task_to_out(task: Task) -> TaskOut:
    return TaskOut(
        id=task.id,
        title=task.title,
        details=task.details,
        status=task.status,
        projectId=task.project_id,
        taskDate=task.task_date.isoformat(),
        createdAt=to_iso(task.created_at),
    )


def note_to_out(note: Note) -> NoteOut:
    return NoteOut(
        id=note.id,
        title=note.title,
        content=note.content,
        noteDate=note.note_date.isoformat(),
        createdAt=to_iso(note.created_at),
    )


def team_event_to_out(event: TeamEvent) -> TeamEventOut:
    return TeamEventOut(
        id=event.id,
        title=event.title,
        eventDate=event.event_date.isoformat(),
        description=event.description,
        owner=event.owner,
        location=event.location,
        createdAt=to_iso(event.created_at),
    )


def ticket_to_out(ticket: Ticket, db: Session) -> TicketOut:
    requester = db.get(User, ticket.requester_id)
    fixed_by = db.get(User, ticket.fixed_by_id) if ticket.fixed_by_id else None
    assignee = db.get(User, ticket.assignee_id) if ticket.assignee_id else None
    evidence_items: list[TicketEvidenceOut] = []
    if ticket.evidence_json:
        try:
            raw_items = json.loads(ticket.evidence_json)
            if isinstance(raw_items, list):
                for raw in raw_items:
                    if not isinstance(raw, dict):
                        continue
                    created_at = str(raw.get("createdAt") or to_iso(datetime.now(timezone.utc)))
                    evidence_items.append(
                        TicketEvidenceOut(
                            id=str(raw.get("id") or str(uuid.uuid4())),
                            text=str(raw.get("text") or ""),
                            imageData=str(raw.get("imageData")) if raw.get("imageData") else None,
                            imageName=str(raw.get("imageName")) if raw.get("imageName") else None,
                            createdAt=created_at,
                        )
                    )
        except json.JSONDecodeError:
            evidence_items = []
    return TicketOut(
        id=ticket.id,
        requesterId=ticket.requester_id,
        requesterEmail=requester.email if requester else "",
        title=ticket.title,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        resolution=ticket.resolution,
        processNotes=ticket.process_notes,
        evidence=evidence_items,
        assigneeId=ticket.assignee_id,
        assigneeEmail=assignee.email if assignee else None,
        slaState=compute_ticket_sla_state(ticket),
        firstResponseDueAt=to_iso(ticket.first_response_due_at) if ticket.first_response_due_at else None,
        resolutionDueAt=to_iso(ticket.resolution_due_at) if ticket.resolution_due_at else None,
        firstRespondedAt=to_iso(ticket.first_responded_at) if ticket.first_responded_at else None,
        resolvedAt=to_iso(ticket.resolved_at) if ticket.resolved_at else None,
        closedAt=to_iso(ticket.closed_at) if ticket.closed_at else None,
        fixedById=ticket.fixed_by_id,
        fixedByEmail=fixed_by.email if fixed_by else None,
        createdAt=to_iso(ticket.created_at),
        updatedAt=to_iso(ticket.updated_at),
    )


def ticket_event_to_out(event: TicketEvent, db: Session) -> TicketEventOut:
    actor_email: str | None = None
    if event.actor_id:
        actor = db.get(User, event.actor_id)
        actor_email = actor.email if actor else None
    payload: dict[str, object] = {}
    if event.payload_json:
        try:
            raw = json.loads(event.payload_json)
            if isinstance(raw, dict):
                payload = raw
        except json.JSONDecodeError:
            payload = {}
    return TicketEventOut(
        id=event.id,
        ticketId=event.ticket_id,
        actorId=event.actor_id,
        actorEmail=actor_email,
        eventType=event.event_type,
        payload=payload,
        createdAt=to_iso(event.created_at),
    )


def maintenance_to_out(record: MaintenanceRecord) -> MaintenanceRecordOut:
    return MaintenanceRecordOut(
        id=record.id,
        maintenanceDate=record.maintenance_date.isoformat(),
        qr=record.qr,
        brand=record.brand,
        model=record.model,
        user=record.user_name,
        serialNumber=record.serial_number,
        consecutive=record.consecutive,
        maintenanceType=record.maintenance_type,
        location=record.location,
        responsibleName=record.responsible_name,
        checks=[
            MaintenanceCheckPayload(
                id=item.id,
                label=item.label,
                category=item.category,
                checked=item.checked,
                observation=item.observation,
            )
            for item in record.checks
        ],
        createdAt=to_iso(record.created_at),
    )


def notification_to_out(notification: Notification) -> NotificationOut:
    return NotificationOut(
        id=notification.id,
        title=notification.title,
        message=notification.message,
        category=notification.category,
        dueDate=notification.due_date.isoformat() if notification.due_date else None,
        read=notification.is_read,
        createdAt=to_iso(notification.created_at),
    )


def article_to_out(article: KnowledgeArticle) -> KnowledgeArticleOut:
    return KnowledgeArticleOut(
        id=article.id,
        title=article.title,
        summary=article.summary,
        content=article.content,
        tags=parse_tags(article.tags),
        createdAt=to_iso(article.created_at),
        updatedAt=to_iso(article.updated_at),
    )


def asset_to_out(asset: Asset) -> AssetOut:
    assigned_user = normalize_assigned_user(asset.user_name)
    return AssetOut(
        id=asset.id,
        assetTag=asset.asset_tag,
        qrCode=asset.qr_code,
        location=asset.location,
        serialNumber=asset.serial_number,
        category=asset.category,
        manufacturer=asset.manufacturer,
        model=asset.model,
        supplier=asset.supplier,
        status=asset.status,
        user=assigned_user,
        condition=asset.condition,
        notes=asset.notes,
        createdAt=to_iso(asset.created_at),
        updatedAt=to_iso(asset.updated_at),
    )


def asset_event_to_out(event: AssetEvent, db: Session) -> AssetEventOut:
    actor_email: str | None = None
    if event.actor_id:
        actor = db.get(User, event.actor_id)
        actor_email = actor.email if actor else None
    payload: dict[str, object] = {}
    if event.payload_json:
        try:
            raw = json.loads(event.payload_json)
            if isinstance(raw, dict):
                payload = raw
        except json.JSONDecodeError:
            payload = {}
    return AssetEventOut(
        id=event.id,
        assetId=event.asset_id,
        actorId=event.actor_id,
        actorEmail=actor_email,
        eventType=event.event_type,
        payload=payload,
        createdAt=to_iso(event.created_at),
    )


def audit_log_to_out(log: AuditLog) -> AuditLogOut:
    payload: dict[str, object] = {}
    if log.payload_json:
        try:
            raw = json.loads(log.payload_json)
            if isinstance(raw, dict):
                payload = raw
        except json.JSONDecodeError:
            payload = {"raw": _truncate_text(log.payload_json, 500)}
    return AuditLogOut(
        id=log.id,
        createdAt=to_iso(log.created_at),
        actorUserId=log.actor_user_id,
        actorEmail=log.actor_email,
        actorRole=log.actor_role,
        action=log.action,
        targetType=log.target_type,
        targetId=log.target_id,
        status=log.status,
        requestId=log.request_id,
        ipAddress=log.ip_address,
        payload=payload,
    )


def person_to_out(person: Person) -> PersonOut:
    linked_user_email: str | None = None
    if person.user_id:
        with SessionLocal() as db:
            linked_user = db.get(User, person.user_id)
            linked_user_email = linked_user.email if linked_user else None
    normalized_role = (person.role or "").strip().lower()
    role_value = normalized_role if normalized_role in (UserRole.admin.value, UserRole.developer.value, UserRole.user.value) else UserRole.user.value
    try:
        department_value = normalize_department(person.job_department)
    except HTTPException:
        department_value = DEPARTMENT_OPTIONS[0]
    return PersonOut(
        id=person.id,
        userId=person.user_id,
        userEmail=linked_user_email,
        legacyId=person.legacy_id,
        name=person.name,
        email=person.email,
        title=person.title,
        role=role_value,
        department=department_value,
        mobile=person.mobile,
        notes=person.notes,
        createdAt=to_iso(person.created_at),
        updatedAt=to_iso(person.updated_at),
    )


