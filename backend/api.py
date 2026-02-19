import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Query, Request
from sqlalchemy import and_, func, or_

try:
    from .core import *  # noqa: F403
except ImportError:
    from core import *  # noqa: F403

router = APIRouter()


def issue_activation_for_user(user: User) -> tuple[str, datetime]:
    token = generate_activation_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=60)
    user.must_set_password = True
    user.activation_token_hash = hash_activation_token(token)
    user.activation_expires_at = expires_at
    return token, expires_at


def parse_iso_datetime(value: str, field_name: str) -> datetime:
    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} must be ISO-8601 datetime") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def encode_audit_cursor(created_at: datetime, item_id: str) -> str:
    return f"{to_iso(created_at)}|{item_id}"


def decode_audit_cursor(cursor: str) -> tuple[datetime, str]:
    value = (cursor or "").strip()
    if "|" not in value:
        raise HTTPException(status_code=400, detail="cursor is invalid")
    date_part, item_id = value.split("|", 1)
    parsed = parse_iso_datetime(date_part, "cursor")
    if not item_id:
        raise HTTPException(status_code=400, detail="cursor is invalid")
    return parsed, item_id


def apply_audit_filters(
    stmt,
    *,
    from_dt: datetime | None,
    to_dt: datetime | None,
    actor_email: str | None,
    action: str | None,
    target_type: str | None,
    target_id: str | None,
    status: str | None,
):
    if from_dt:
        stmt = stmt.where(AuditLog.created_at >= from_dt)
    if to_dt:
        stmt = stmt.where(AuditLog.created_at <= to_dt)
    if actor_email:
        stmt = stmt.where(AuditLog.actor_email.ilike(f"%{actor_email.strip()}%"))
    if action:
        stmt = stmt.where(AuditLog.action == action.strip().lower())
    if target_type:
        stmt = stmt.where(AuditLog.target_type == target_type.strip().lower())
    if target_id:
        stmt = stmt.where(AuditLog.target_id == target_id.strip())
    if status:
        normalized_status = status.strip().lower()
        if normalized_status not in ("success", "failure"):
            raise HTTPException(status_code=400, detail="status must be success|failure")
        stmt = stmt.where(AuditLog.status == normalized_status)
    return stmt


def parse_page_args(page: int, page_size: int) -> tuple[int, int, int]:
    safe_page = max(page, 1)
    safe_page_size = min(max(page_size, 1), 100)
    offset = (safe_page - 1) * safe_page_size
    return safe_page, safe_page_size, offset


def parse_sort_direction(sort_dir: str) -> str:
    value = (sort_dir or "asc").strip().lower()
    if value not in ("asc", "desc"):
        raise HTTPException(status_code=400, detail="sortDir must be asc|desc")
    return value


def user_to_out(user: User) -> AdminUserOut:
    return AdminUserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        preferredLanguage=user.preferred_language,
        mustSetPassword=user.must_set_password,
        createdAt=to_iso(user.created_at),
    )


@router.post("/api/auth/register", response_model=AuthOut)
def register(payload: AuthRegisterIn, _: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    normalized_email = normalize_login_identity(payload.email)
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=payload.role.value,
        preferred_language="en",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthOut(
        token=create_access_token(user),
        user_email=user.email,
        role=user.role,
        preferred_language=user.preferred_language,
    )


@router.post("/api/auth/login", response_model=AuthOut)
def login(payload: AuthLoginIn, db: Session = Depends(get_db)):
    normalized_email = normalize_login_identity(payload.email)
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.must_set_password:
        raise HTTPException(status_code=403, detail="Account activation required. Use your activation link to set a password.")
    return AuthOut(
        token=create_access_token(user),
        user_email=user.email,
        role=user.role,
        preferred_language=user.preferred_language,
    )


@router.post("/api/auth/activate", response_model=AuthOut)
def activate_account(payload: AuthActivateIn, request: Request, db: Session = Depends(get_db)):
    request_id = get_request_id(request)
    ip_address = get_request_ip(request)
    raw_token = (payload.token or "").strip()
    if not raw_token:
        write_audit_log(
            db,
            actor=None,
            action="auth.activate",
            target_type="auth",
            target_id=None,
            status="failure",
            payload={"reason": "missing_token"},
            request_id=request_id,
            ip_address=ip_address,
        )
        raise HTTPException(status_code=400, detail="Activation token is required")
    hashed_token = hash_activation_token(raw_token)
    user = db.scalar(select(User).where(User.activation_token_hash == hashed_token))
    if not user or not user.must_set_password:
        write_audit_log(
            db,
            actor=None,
            action="auth.activate",
            target_type="auth",
            target_id=None,
            status="failure",
            payload={"reason": "invalid_or_used_token"},
            request_id=request_id,
            ip_address=ip_address,
        )
        raise HTTPException(status_code=400, detail="Invalid or already used activation token")
    now = datetime.now(timezone.utc)
    if not user.activation_expires_at or user.activation_expires_at < now:
        write_audit_log(
            db,
            actor=user,
            action="auth.activate",
            target_type="auth",
            target_id=user.id,
            status="failure",
            payload={"reason": "expired_token"},
            request_id=request_id,
            ip_address=ip_address,
        )
        raise HTTPException(status_code=400, detail="Activation token expired")
    user.password_hash = hash_password(payload.newPassword)
    user.must_set_password = False
    user.activation_token_hash = None
    user.activation_expires_at = None
    db.commit()
    db.refresh(user)
    write_audit_log(
        db,
        actor=user,
        action="auth.activate",
        target_type="auth",
        target_id=user.id,
        status="success",
        payload={"result": "password_set"},
        request_id=request_id,
        ip_address=ip_address,
    )
    return AuthOut(
        token=create_access_token(user),
        user_email=user.email,
        role=user.role,
        preferred_language=user.preferred_language,
    )


@router.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person = db.scalar(select(Person).where(Person.user_id == current_user.id))
    if not person:
        person = db.scalar(select(Person).where(Person.email == current_user.email).order_by(Person.updated_at.desc()))
    return {
        "user_email": current_user.email,
        "role": current_user.role,
        "preferred_language": current_user.preferred_language,
        "name": person.name if person else None,
        "department": person.job_department if person else None,
        "title": person.title if person else None,
        "mobile": person.mobile if person else None,
    }


@router.get("/api/module-access/me", response_model=RoleModuleAccessMeOut)
def get_my_module_access(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return RoleModuleAccessMeOut(role=current_user.role, modules=get_role_module_access_map(db, current_user.role))


@router.patch("/api/account/preferences")
def update_preferences(payload: LanguagePreferenceIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    language = payload.preferredLanguage.lower()
    if language not in ("en", "es"):
        raise HTTPException(status_code=400, detail="preferredLanguage must be en or es")
    current_user.preferred_language = language
    db.commit()
    return {"ok": True, "preferred_language": language}


@router.post("/api/auth/change-password")
def change_password(payload: ChangePasswordIn, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    request_id = get_request_id(request)
    ip_address = get_request_ip(request)
    if not verify_password(payload.currentPassword, current_user.password_hash):
        write_audit_log(
            db,
            actor=current_user,
            action="auth.change_password",
            target_type="auth",
            target_id=current_user.id,
            status="failure",
            payload={"reason": "incorrect_current_password"},
            request_id=request_id,
            ip_address=ip_address,
        )
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(payload.newPassword)
    db.commit()
    write_audit_log(
        db,
        actor=current_user,
        action="auth.change_password",
        target_type="auth",
        target_id=current_user.id,
        status="success",
        payload={"result": "password_updated"},
        request_id=request_id,
        ip_address=ip_address,
    )
    return {"ok": True}


@router.get("/api/admin/users", response_model=list[AdminUserOut])
def list_users(_: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [user_to_out(user) for user in users]


@router.get("/api/admin/users/list", response_model=AdminUserListOut)
def list_users_paginated(
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    sortBy: str = Query(default="createdAt"),
    sortDir: str = Query(default="desc"),
    page: int = Query(default=1),
    pageSize: int = Query(default=20),
    _: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    safe_page, safe_page_size, offset = parse_page_args(page, pageSize)
    direction = parse_sort_direction(sortDir)
    sort_columns = {
        "createdAt": User.created_at,
        "email": User.email,
        "role": User.role,
    }
    sort_column = sort_columns.get(sortBy)
    if sort_column is None:
        raise HTTPException(status_code=400, detail="sortBy must be createdAt|email|role")
    conditions: list[object] = []
    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(or_(User.email.ilike(term), User.role.ilike(term)))
    if role and role.strip():
        conditions.append(User.role == normalize_role_name(role))
    users_stmt = select(User)
    total_stmt = select(func.count()).select_from(User)
    if conditions:
        users_stmt = users_stmt.where(*conditions)
        total_stmt = total_stmt.where(*conditions)
    if direction == "asc":
        users_stmt = users_stmt.order_by(sort_column.asc(), User.id.asc())
    else:
        users_stmt = users_stmt.order_by(sort_column.desc(), User.id.desc())
    users = db.scalars(users_stmt.offset(offset).limit(safe_page_size)).all()
    total = int(db.scalar(total_stmt) or 0)
    return AdminUserListOut(
        items=[user_to_out(user) for user in users],
        total=total,
        page=safe_page,
        pageSize=safe_page_size,
    )


@router.post("/api/admin/users", response_model=AdminCreateUserOut)
def create_user(payload: AdminCreateUserIn, request: Request, current_admin: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    normalized_email = normalize_login_identity(payload.email)
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(
        email=normalized_email,
        password_hash=hash_password(generate_activation_token()),
        role=payload.role.value,
    )
    activation_token, activation_expires_at = issue_activation_for_user(user)
    db.add(user)
    db.commit()
    db.refresh(user)
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.user.create",
        target_type="user",
        target_id=user.id,
        status="success",
        payload={"email": user.email, "role": user.role, "mustSetPassword": user.must_set_password},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return AdminCreateUserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        preferredLanguage=user.preferred_language,
        mustSetPassword=user.must_set_password,
        activationToken=activation_token,
        activationExpiresAt=to_iso(activation_expires_at),
        createdAt=to_iso(user.created_at),
    )


@router.patch("/api/admin/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: str,
    payload: AdminUpdateUserIn,
    request: Request,
    current_admin: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    normalized_email = normalize_login_identity(payload.email)
    existing = db.scalar(select(User).where(User.email == normalized_email, User.id != user_id))
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")
    before = {"email": user.email, "role": user.role}
    user.email = normalized_email
    if user.id == current_admin.id and payload.role != UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot downgrade your own admin role")
    user.role = payload.role.value
    db.commit()
    db.refresh(user)
    changed = diff_fields(before, {"email": user.email, "role": user.role})
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.user.update",
        target_type="user",
        target_id=user.id,
        status="success",
        payload={"changed": changed},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return AdminUserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        preferredLanguage=user.preferred_language,
        mustSetPassword=user.must_set_password,
        createdAt=to_iso(user.created_at),
    )


@router.post("/api/admin/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    payload: AdminResetPasswordIn,
    request: Request,
    current_admin: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    next_password = (payload.password or "").strip()
    if len(next_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.password_hash = hash_password(next_password)
    user.must_set_password = False
    user.activation_token_hash = None
    user.activation_expires_at = None
    db.commit()
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.user.reset_password",
        target_type="user",
        target_id=user.id,
        status="success",
        payload={"email": user.email},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return {"ok": True}


@router.post("/api/admin/users/{user_id}/activation-link", response_model=AdminUserActivationOut)
def generate_user_activation_link(
    user_id: str,
    request: Request,
    current_admin: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    activation_token, activation_expires_at = issue_activation_for_user(user)
    db.commit()
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.user.generate_activation_link",
        target_type="user",
        target_id=user.id,
        status="success",
        payload={"email": user.email, "tokenIssued": True, "activationExpiresAt": to_iso(activation_expires_at)},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return AdminUserActivationOut(
        userId=user.id,
        email=user.email,
        activationToken=activation_token,
        activationExpiresAt=to_iso(activation_expires_at),
    )


@router.delete("/api/admin/users/{user_id}")
def delete_user(user_id: str, request: Request, current_admin: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    deleted_payload = {"email": user.email, "role": user.role}
    db.delete(user)
    db.commit()
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.user.delete",
        target_type="user",
        target_id=user_id,
        status="success",
        payload=deleted_payload,
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return {"ok": True}


@router.post("/api/admin/users/bulk-delete", response_model=BulkDeleteOut)
def bulk_delete_users(
    payload: BulkIdsIn,
    request: Request,
    current_admin: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    requested_ids = [value for value in payload.ids if value]
    if not requested_ids:
        return BulkDeleteOut(deleted=0)
    if current_admin.id in requested_ids:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    unique_ids = list(dict.fromkeys(requested_ids))
    users = db.scalars(select(User).where(User.id.in_(unique_ids))).all()
    deleted_ids: list[str] = []
    for item in users:
        deleted_ids.append(item.id)
        db.delete(item)
    db.commit()
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.user.bulk_delete",
        target_type="user",
        target_id=None,
        status="success",
        payload={"requested": len(unique_ids), "deleted": len(deleted_ids), "userIds": deleted_ids},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return BulkDeleteOut(deleted=len(deleted_ids))


@router.get("/api/admin/people", response_model=list[PersonOut])
def list_people(_: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    items = db.scalars(select(Person).order_by(Person.name.asc())).all()
    return [person_to_out(item) for item in items]


@router.get("/api/admin/people/list", response_model=PersonListOut)
def list_people_paginated(
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    department: str | None = Query(default=None),
    sortBy: str = Query(default="name"),
    sortDir: str = Query(default="asc"),
    page: int = Query(default=1),
    pageSize: int = Query(default=20),
    _: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    safe_page, safe_page_size, offset = parse_page_args(page, pageSize)
    direction = parse_sort_direction(sortDir)
    sort_columns = {
        "name": Person.name,
        "email": Person.email,
        "role": Person.role,
        "department": Person.job_department,
        "updatedAt": Person.updated_at,
        "createdAt": Person.created_at,
    }
    sort_column = sort_columns.get(sortBy)
    if sort_column is None:
        raise HTTPException(status_code=400, detail="sortBy must be name|email|role|department|updatedAt|createdAt")
    conditions: list[object] = []
    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            or_(
                Person.name.ilike(term),
                Person.email.ilike(term),
                Person.title.ilike(term),
                Person.role.ilike(term),
                Person.job_department.ilike(term),
                Person.mobile.ilike(term),
            )
        )
    if role and role.strip():
        conditions.append(Person.role == normalize_role_name(role))
    if department and department.strip():
        conditions.append(Person.job_department == department.strip())
    people_stmt = select(Person)
    total_stmt = select(func.count()).select_from(Person)
    if conditions:
        people_stmt = people_stmt.where(*conditions)
        total_stmt = total_stmt.where(*conditions)
    if direction == "asc":
        people_stmt = people_stmt.order_by(sort_column.asc(), Person.id.asc())
    else:
        people_stmt = people_stmt.order_by(sort_column.desc(), Person.id.desc())
    items = db.scalars(people_stmt.offset(offset).limit(safe_page_size)).all()
    total = int(db.scalar(total_stmt) or 0)
    return PersonListOut(
        items=[person_to_out(item) for item in items],
        total=total,
        page=safe_page,
        pageSize=safe_page_size,
    )


def generate_placeholder_email(name: str, db: Session) -> str:
    base = "".join(ch for ch in name.lower() if ch.isalnum())
    if not base:
        base = "user"
    candidate = f"{base}@tdcon40.com"
    exists = db.scalar(select(User).where(User.email == candidate))
    if exists:
        raise HTTPException(status_code=409, detail="Generated username already exists for this name; provide email manually")
    return candidate


def resolve_person_user_email(raw_email: str, name: str, db: Session, exclude_user_id: str | None = None) -> str:
    value = (raw_email or "").strip()
    if not value:
        return generate_placeholder_email(name, db)
    normalized = normalize_login_identity(value)
    query = select(User).where(User.email == normalized)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    existing = db.scalar(query)
    if existing:
        raise HTTPException(status_code=409, detail="User email already exists")
    return normalized


@router.post("/api/admin/people", response_model=PersonOut)
def create_person(payload: PersonIn, request: Request, current_admin: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    department = normalize_department(payload.department)
    item = Person(
        type="user",
        role_id=2,
        client_id=1,
        name=name,
        email=payload.email.strip().lower(),
        title=payload.title.strip(),
        role=payload.role.value,
        job_department=department,
        mobile=payload.mobile.strip(),
        notes=payload.notes.strip(),
        lang="en",
        tickets_notification=False,
    )
    db.add(item)
    db.flush()
    user_email = resolve_person_user_email(payload.email, name, db)
    linked_user = User(
        email=user_email,
        password_hash=hash_password(generate_activation_token()),
        role=payload.role.value,
        preferred_language=item.lang if item.lang in ("en", "es") else "en",
    )
    activation_token, activation_expires_at = issue_activation_for_user(linked_user)
    db.add(linked_user)
    db.flush()
    item.user_id = linked_user.id
    db.commit()
    db.refresh(item)
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.person.create",
        target_type="person",
        target_id=item.id,
        status="success",
        payload={
            "name": item.name,
            "email": item.email,
            "role": item.role,
            "department": item.job_department,
            "userId": item.user_id,
            "tokenIssued": True,
            "activationExpiresAt": to_iso(activation_expires_at),
        },
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    person_out = person_to_out(item)
    return person_out.model_copy(
        update={
            "activationToken": activation_token,
            "activationExpiresAt": to_iso(activation_expires_at),
        }
    )


@router.patch("/api/admin/people/{person_id}", response_model=PersonOut)
def update_person(
    person_id: str,
    payload: PersonIn,
    request: Request,
    current_admin: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    item = db.get(Person, person_id)
    if not item:
        raise HTTPException(status_code=404, detail="Person not found")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    before = {
        "name": item.name,
        "email": item.email,
        "title": item.title,
        "role": item.role,
        "department": item.job_department,
        "mobile": item.mobile,
        "notes": item.notes,
        "userId": item.user_id,
    }
    department = normalize_department(payload.department)
    item.name = name
    item.email = payload.email.strip().lower()
    item.title = payload.title.strip()
    item.role = payload.role.value
    item.job_department = department
    item.mobile = payload.mobile.strip()
    item.notes = payload.notes.strip()
    activation_token: str | None = None
    activation_expires_at: datetime | None = None
    if item.user_id:
        linked_user = db.get(User, item.user_id)
        if linked_user:
            linked_user.role = payload.role.value
            if payload.email.strip():
                linked_user.email = resolve_person_user_email(payload.email, name, db, exclude_user_id=linked_user.id)
    else:
        linked_user = User(
            email=resolve_person_user_email(payload.email, name, db),
            password_hash=hash_password(generate_activation_token()),
            role=payload.role.value,
            preferred_language=item.lang if item.lang in ("en", "es") else "en",
        )
        activation_token, activation_expires_at = issue_activation_for_user(linked_user)
        db.add(linked_user)
        db.flush()
        item.user_id = linked_user.id
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    after = {
        "name": item.name,
        "email": item.email,
        "title": item.title,
        "role": item.role,
        "department": item.job_department,
        "mobile": item.mobile,
        "notes": item.notes,
        "userId": item.user_id,
    }
    audit_payload: dict[str, object] = {
        "changed": diff_fields(before, after),
        "tokenIssued": bool(activation_token),
    }
    if activation_expires_at:
        audit_payload["activationExpiresAt"] = to_iso(activation_expires_at)
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.person.update",
        target_type="person",
        target_id=item.id,
        status="success",
        payload=audit_payload,
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    person_out = person_to_out(item)
    if activation_token and activation_expires_at:
        return person_out.model_copy(
            update={
                "activationToken": activation_token,
                "activationExpiresAt": to_iso(activation_expires_at),
            }
        )
    return person_out


@router.delete("/api/admin/people/{person_id}")
def delete_person(person_id: str, request: Request, current_admin: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    item = db.get(Person, person_id)
    if not item:
        raise HTTPException(status_code=404, detail="Person not found")
    deleted_payload = {
        "name": item.name,
        "email": item.email,
        "role": item.role,
        "department": item.job_department,
        "userId": item.user_id,
    }
    db.delete(item)
    db.commit()
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.person.delete",
        target_type="person",
        target_id=person_id,
        status="success",
        payload=deleted_payload,
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return {"ok": True}


@router.post("/api/admin/people/bulk-delete", response_model=BulkDeleteOut)
def bulk_delete_people(
    payload: BulkIdsIn,
    request: Request,
    current_admin: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    requested_ids = [value for value in payload.ids if value]
    if not requested_ids:
        return BulkDeleteOut(deleted=0)
    unique_ids = list(dict.fromkeys(requested_ids))
    items = db.scalars(select(Person).where(Person.id.in_(unique_ids))).all()
    deleted_ids: list[str] = []
    for item in items:
        deleted_ids.append(item.id)
        db.delete(item)
    db.commit()
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.person.bulk_delete",
        target_type="person",
        target_id=None,
        status="success",
        payload={"requested": len(unique_ids), "deleted": len(deleted_ids), "personIds": deleted_ids},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return BulkDeleteOut(deleted=len(deleted_ids))


@router.get("/api/projects", response_model=list[ProjectOut])
def list_projects(current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    projects = db.scalars(select(Project).where(Project.owner_id == current_user.id).order_by(Project.created_at.desc())).all()
    return [project_to_out(item) for item in projects]


@router.post("/api/projects", response_model=ProjectOut)
def create_project(payload: ProjectIn, current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    project = Project(owner_id=current_user.id, name=payload.name, description=payload.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_to_out(project)


@router.delete("/api/projects/{project_id}")
def delete_project(project_id: str, current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    project = db.scalar(select(Project).where(Project.id == project_id, Project.owner_id == current_user.id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}


@router.get("/api/tasks", response_model=list[TaskOut])
def list_tasks(current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    tasks = db.scalars(select(Task).where(Task.owner_id == current_user.id).order_by(Task.created_at.desc())).all()
    return [task_to_out(item) for item in tasks]


@router.post("/api/tasks", response_model=TaskOut)
def create_task(payload: TaskIn, current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    task = Task(
        owner_id=current_user.id,
        title=payload.title,
        details=payload.details,
        project_id=payload.projectId,
        task_date=parse_date(payload.taskDate),
        status="todo",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_out(task)


@router.patch("/api/tasks/{task_id}/status")
def update_task_status(task_id: str, payload: TaskStatusPatch, current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    task = db.scalar(select(Task).where(Task.id == task_id, Task.owner_id == current_user.id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = payload.status
    db.commit()
    return {"ok": True}


@router.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    task = db.scalar(select(Task).where(Task.id == task_id, Task.owner_id == current_user.id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}


@router.get("/api/notes", response_model=list[NoteOut])
def list_notes(current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    notes = db.scalars(select(Note).where(Note.owner_id == current_user.id).order_by(Note.created_at.desc())).all()
    return [note_to_out(item) for item in notes]


@router.post("/api/notes", response_model=NoteOut)
def create_note(payload: NoteIn, current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    note = Note(owner_id=current_user.id, title=payload.title, content=payload.content, note_date=parse_date(payload.noteDate))
    db.add(note)
    db.commit()
    db.refresh(note)
    return note_to_out(note)


@router.delete("/api/notes/{note_id}")
def delete_note(note_id: str, current_user: User = Depends(require_personal_access), db: Session = Depends(get_db)):
    note = db.scalar(select(Note).where(Note.id == note_id, Note.owner_id == current_user.id))
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"ok": True}


@router.get("/api/notifications", response_model=list[NotificationOut])
def list_notifications(current_user: User = Depends(require_work_access), db: Session = Depends(get_db)):
    notifications = db.scalars(
        select(Notification)
        .where(Notification.owner_id == current_user.id)
        .order_by(Notification.is_read.asc(), Notification.due_date.asc(), Notification.created_at.desc())
    ).all()
    return [notification_to_out(item) for item in notifications]


@router.post("/api/notifications", response_model=NotificationOut)
def create_notification(payload: NotificationIn, current_user: User = Depends(require_work_access), db: Session = Depends(get_db)):
    category = payload.category.strip().lower()
    if category not in ("info", "reminder", "warning"):
        raise HTTPException(status_code=400, detail="category must be info|reminder|warning")
    item = Notification(
        owner_id=current_user.id,
        title=payload.title.strip(),
        message=payload.message.strip(),
        category=category,
        due_date=parse_optional_date(payload.dueDate),
        is_read=False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return notification_to_out(item)


@router.patch("/api/notifications/{notification_id}/read")
def patch_notification_read(
    notification_id: str,
    payload: NotificationReadPatchIn,
    current_user: User = Depends(require_work_access),
    db: Session = Depends(get_db),
):
    item = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.owner_id == current_user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = payload.read
    db.commit()
    return {"ok": True}


@router.delete("/api/notifications/{notification_id}")
def delete_notification(notification_id: str, current_user: User = Depends(require_work_access), db: Session = Depends(get_db)):
    item = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.owner_id == current_user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/api/knowledge-base", response_model=list[KnowledgeArticleOut])
def list_knowledge_articles(current_user: User = Depends(require_team_work_access), db: Session = Depends(get_db)):
    articles = db.scalars(
        select(KnowledgeArticle)
        .order_by(KnowledgeArticle.updated_at.desc())
    ).all()
    return [article_to_out(item) for item in articles]


@router.post("/api/knowledge-base", response_model=KnowledgeArticleOut)
def create_knowledge_article(payload: KnowledgeArticleIn, current_user: User = Depends(require_team_work_access), db: Session = Depends(get_db)):
    article = KnowledgeArticle(
        owner_id=current_user.id,
        title=payload.title.strip(),
        summary=payload.summary.strip(),
        content=payload.content.strip(),
        tags=serialize_tags(payload.tags),
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article_to_out(article)


@router.patch("/api/knowledge-base/{article_id}", response_model=KnowledgeArticleOut)
def update_knowledge_article(
    article_id: str,
    payload: KnowledgeArticleIn,
    current_user: User = Depends(require_team_work_access),
    db: Session = Depends(get_db),
):
    article = db.scalar(select(KnowledgeArticle).where(KnowledgeArticle.id == article_id))
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.title = payload.title.strip()
    article.summary = payload.summary.strip()
    article.content = payload.content.strip()
    article.tags = serialize_tags(payload.tags)
    article.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(article)
    return article_to_out(article)


@router.delete("/api/knowledge-base/{article_id}")
def delete_knowledge_article(article_id: str, current_user: User = Depends(require_team_work_access), db: Session = Depends(get_db)):
    article = db.scalar(select(KnowledgeArticle).where(KnowledgeArticle.id == article_id))
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    return {"ok": True}


@router.get("/api/assets", response_model=list[AssetOut])
def list_assets(current_user: User = Depends(require_assets_access), db: Session = Depends(get_db)):
    if current_user.role in (UserRole.admin.value, UserRole.developer.value):
        items = db.scalars(select(Asset).order_by(Asset.updated_at.desc())).all()
    else:
        items = db.scalars(select(Asset).where(Asset.owner_id == current_user.id).order_by(Asset.updated_at.desc())).all()
    return [asset_to_out(item) for item in items]


@router.get("/api/assets/{asset_id}/history", response_model=list[AssetEventOut])
def list_asset_history(asset_id: str, current_user: User = Depends(require_assets_access), db: Session = Depends(get_db)):
    if current_user.role in (UserRole.admin.value, UserRole.developer.value):
        item = db.scalar(select(Asset).where(Asset.id == asset_id))
    else:
        item = db.scalar(select(Asset).where(Asset.id == asset_id, Asset.owner_id == current_user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Asset not found")
    events = db.scalars(select(AssetEvent).where(AssetEvent.asset_id == asset_id).order_by(AssetEvent.created_at.desc())).all()
    return [asset_event_to_out(event, db) for event in events]


@router.post("/api/assets", response_model=AssetOut)
def create_asset(payload: AssetIn, current_user: User = Depends(require_assets_access), db: Session = Depends(get_db)):
    status_value = payload.status.strip().lower()
    if status_value not in ("active", "maintenance", "retired", "lost"):
        raise HTTPException(status_code=400, detail="status must be active|maintenance|retired|lost")

    assigned_user = normalize_assigned_user(payload.user)
    qr_class = normalize_qr_class(payload.qrClass)
    generated_tag = build_next_asset_tag(db)
    generated_qr = build_qr_code_from_asset_tag(generated_tag, qr_class)
    item = Asset(
        owner_id=current_user.id,
        asset_tag=generated_tag,
        name=payload.model.strip() or payload.serialNumber.strip().upper() or generated_tag,
        qr_code=generated_qr,
        location=payload.location.strip(),
        serial_number=payload.serialNumber.strip().upper(),
        category=payload.category.strip(),
        manufacturer=payload.manufacturer.strip(),
        model=payload.model.strip(),
        supplier=payload.supplier.strip(),
        status=status_value,
        assigned_to=assigned_user,
        purchase_date=None,
        warranty_until=None,
        notes=payload.notes.strip(),
        user_name=assigned_user,
        condition=payload.condition.strip(),
    )
    db.add(item)
    db.flush()
    log_asset_event(
        db,
        item.id,
        current_user.id,
        "created",
        {
            "assetTag": item.asset_tag,
            "status": item.status,
            "location": item.location,
            "user": item.user_name,
        },
    )
    db.commit()
    db.refresh(item)
    return asset_to_out(item)


@router.patch("/api/assets/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: str, payload: AssetIn, current_user: User = Depends(require_assets_access), db: Session = Depends(get_db)):
    if current_user.role in (UserRole.admin.value, UserRole.developer.value):
        item = db.scalar(select(Asset).where(Asset.id == asset_id))
    else:
        item = db.scalar(select(Asset).where(Asset.id == asset_id, Asset.owner_id == current_user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Asset not found")

    status_value = payload.status.strip().lower()
    if status_value not in ("active", "maintenance", "retired", "lost"):
        raise HTTPException(status_code=400, detail="status must be active|maintenance|retired|lost")

    assigned_user = normalize_assigned_user(payload.user)
    qr_class = normalize_qr_class(payload.qrClass)
    qr_code_value = build_qr_code_from_asset_tag(item.asset_tag, qr_class)
    previous = {
        "qrCode": item.qr_code,
        "location": item.location,
        "serialNumber": item.serial_number,
        "category": item.category,
        "manufacturer": item.manufacturer,
        "model": item.model,
        "supplier": item.supplier,
        "status": item.status,
        "user": item.user_name,
        "condition": item.condition,
        "notes": item.notes,
    }

    item.name = payload.model.strip() or payload.serialNumber.strip().upper() or item.asset_tag
    item.qr_code = qr_code_value
    item.location = payload.location.strip()
    item.serial_number = payload.serialNumber.strip().upper()
    item.category = payload.category.strip()
    item.manufacturer = payload.manufacturer.strip()
    item.model = payload.model.strip()
    item.supplier = payload.supplier.strip()
    item.status = status_value
    item.assigned_to = assigned_user
    item.purchase_date = None
    item.warranty_until = None
    item.notes = payload.notes.strip()
    item.user_name = assigned_user
    item.condition = payload.condition.strip()
    item.updated_at = datetime.now(timezone.utc)
    current = {
        "qrCode": item.qr_code,
        "location": item.location,
        "serialNumber": item.serial_number,
        "category": item.category,
        "manufacturer": item.manufacturer,
        "model": item.model,
        "supplier": item.supplier,
        "status": item.status,
        "user": item.user_name,
        "condition": item.condition,
        "notes": item.notes,
    }
    changes = {
        key: {"before": previous[key], "after": current[key]}
        for key in current
        if previous[key] != current[key]
    }
    if changes:
        log_asset_event(
            db,
            item.id,
            current_user.id,
            "updated",
            {"changes": changes},
        )
    db.commit()
    db.refresh(item)
    return asset_to_out(item)


@router.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: str, current_user: User = Depends(require_assets_access), db: Session = Depends(get_db)):
    if current_user.role in (UserRole.admin.value, UserRole.developer.value):
        item = db.scalar(select(Asset).where(Asset.id == asset_id))
    else:
        item = db.scalar(select(Asset).where(Asset.id == asset_id, Asset.owner_id == current_user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Asset not found")
    log_asset_event(
        db,
        item.id,
        current_user.id,
        "deleted",
        {"assetTag": item.asset_tag, "status": item.status, "location": item.location, "user": item.user_name},
    )
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.post("/api/assets/bulk-delete", response_model=BulkDeleteOut)
def bulk_delete_assets(payload: BulkIdsIn, current_user: User = Depends(require_team_assets_access), db: Session = Depends(get_db)):
    requested_ids = [value for value in payload.ids if value]
    if not requested_ids:
        return BulkDeleteOut(deleted=0)
    unique_ids = list(dict.fromkeys(requested_ids))
    items = db.scalars(select(Asset).where(Asset.id.in_(unique_ids))).all()
    deleted = 0
    for item in items:
        log_asset_event(
            db,
            item.id,
            current_user.id,
            "deleted",
            {"assetTag": item.asset_tag, "status": item.status, "location": item.location, "user": item.user_name},
        )
        db.delete(item)
        deleted += 1
    db.commit()
    return BulkDeleteOut(deleted=deleted)


@router.get("/api/admin/module-access", response_model=list[RoleModuleAccessOut])
def list_module_access(_: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    output: list[RoleModuleAccessOut] = []
    for role_name in (UserRole.admin.value, UserRole.developer.value, UserRole.user.value):
        current = get_role_module_access_map(db, role_name)
        for module_name in MODULE_NAMES:
            row = db.scalar(
                select(RoleModuleAccess).where(
                    RoleModuleAccess.role == role_name,
                    RoleModuleAccess.module == module_name,
                )
            )
            updated_at = row.updated_at if row else datetime.now(timezone.utc)
            output.append(
                RoleModuleAccessOut(
                    role=role_name,
                    module=module_name,
                    enabled=bool(current.get(module_name, True)),
                    updatedAt=to_iso(updated_at),
                )
            )
    return output


@router.patch("/api/admin/module-access/{role_name}/{module_name}", response_model=RoleModuleAccessOut)
def patch_module_access(
    role_name: str,
    module_name: str,
    payload: RoleModuleAccessPatchIn,
    request: Request,
    current_admin: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    normalized_role = normalize_role_name(role_name)
    normalized_module = normalize_module_name(module_name)
    if normalized_role == UserRole.admin.value and normalized_module == "admin" and not payload.enabled:
        raise HTTPException(status_code=400, detail="Cannot disable admin module for admin role")
    row = db.scalar(
        select(RoleModuleAccess).where(
            RoleModuleAccess.role == normalized_role,
            RoleModuleAccess.module == normalized_module,
        )
    )
    now = datetime.now(timezone.utc)
    if not row:
        row = RoleModuleAccess(
            role=normalized_role,
            module=normalized_module,
            enabled=payload.enabled,
            updated_at=now,
        )
        db.add(row)
    else:
        row.enabled = payload.enabled
        row.updated_at = now
    if normalized_role == current_admin.role and normalized_module == "admin" and not payload.enabled:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin module access")
    db.commit()
    db.refresh(row)
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.module_access.update",
        target_type="module_access",
        target_id=f"{row.role}:{row.module}",
        status="success",
        payload={"role": row.role, "module": row.module, "enabled": row.enabled},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return RoleModuleAccessOut(role=row.role, module=row.module, enabled=row.enabled, updatedAt=to_iso(row.updated_at))


@router.get("/api/admin/audit-logs", response_model=AuditLogListOut)
def list_audit_logs(
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
    actorEmail: str | None = Query(default=None),
    action: str | None = Query(default=None),
    targetType: str | None = Query(default=None),
    targetId: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50),
    cursor: str | None = Query(default=None),
    _: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    limit_value = min(max(limit, 1), 200)
    from_dt = parse_iso_datetime(from_, "from") if from_ else None
    to_dt = parse_iso_datetime(to, "to") if to else None
    if from_dt and to_dt and to_dt < from_dt:
        raise HTTPException(status_code=400, detail="to must be greater than from")

    stmt = select(AuditLog)
    stmt = apply_audit_filters(
        stmt,
        from_dt=from_dt,
        to_dt=to_dt,
        actor_email=actorEmail,
        action=action,
        target_type=targetType,
        target_id=targetId,
        status=status_filter,
    )
    if cursor:
        cursor_created_at, cursor_id = decode_audit_cursor(cursor)
        stmt = stmt.where(
            or_(
                AuditLog.created_at < cursor_created_at,
                and_(AuditLog.created_at == cursor_created_at, AuditLog.id < cursor_id),
            )
        )
    stmt = stmt.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(limit_value + 1)
    rows = db.scalars(stmt).all()
    next_cursor: str | None = None
    if len(rows) > limit_value:
        last = rows[limit_value - 1]
        next_cursor = encode_audit_cursor(last.created_at, last.id)
        rows = rows[:limit_value]
    return AuditLogListOut(items=[audit_log_to_out(item) for item in rows], nextCursor=next_cursor)


@router.get("/api/admin/audit-logs/export.csv")
def export_audit_logs_csv(
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
    actorEmail: str | None = Query(default=None),
    action: str | None = Query(default=None),
    targetType: str | None = Query(default=None),
    targetId: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    _: User = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    max_window = timedelta(days=31)
    from_dt = parse_iso_datetime(from_, "from") if from_ else None
    to_dt = parse_iso_datetime(to, "to") if to else None
    now = datetime.now(timezone.utc)
    if from_dt is None and to_dt is None:
        to_dt = now
        from_dt = now - max_window
    elif from_dt is None and to_dt is not None:
        from_dt = to_dt - max_window
    elif from_dt is not None and to_dt is None:
        to_dt = min(from_dt + max_window, now)
    if from_dt is None or to_dt is None:
        raise HTTPException(status_code=400, detail="Could not resolve export date window")
    if to_dt < from_dt:
        raise HTTPException(status_code=400, detail="to must be greater than from")
    if to_dt - from_dt > max_window:
        raise HTTPException(status_code=400, detail="Export window cannot exceed 31 days")

    stmt = select(AuditLog)
    stmt = apply_audit_filters(
        stmt,
        from_dt=from_dt,
        to_dt=to_dt,
        actor_email=actorEmail,
        action=action,
        target_type=targetType,
        target_id=targetId,
        status=status_filter,
    )
    rows = db.scalars(stmt.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(10000)).all()

    def stream_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "createdAt",
                "actorEmail",
                "actorRole",
                "action",
                "targetType",
                "targetId",
                "status",
                "requestId",
                "ipAddress",
                "payload",
            ]
        )
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        for row in rows:
            writer.writerow(
                [
                    to_iso(row.created_at),
                    row.actor_email,
                    row.actor_role,
                    row.action,
                    row.target_type,
                    row.target_id or "",
                    row.status,
                    row.request_id,
                    row.ip_address or "",
                    row.payload_json or "{}",
                ]
            )
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    filename = f"audit-logs-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.csv"
    return StreamingResponse(
        stream_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/api/admin/audit-logs/cleanup", response_model=AuditCleanupOut)
def cleanup_audit_logs(request: Request, current_admin: User = Depends(require_admin_access), db: Session = Depends(get_db)):
    total_deleted = 0
    batch_size = 1000
    while True:
        result = db.execute(
            text(
                "DELETE FROM audit_logs WHERE id IN ("
                "SELECT id FROM audit_logs WHERE retention_until < NOW() ORDER BY retention_until ASC LIMIT :batch_size)"
            ),
            {"batch_size": batch_size},
        )
        deleted = int(result.rowcount or 0)
        db.commit()
        total_deleted += deleted
        if deleted < batch_size:
            break
    write_audit_log(
        db,
        actor=current_admin,
        action="admin.audit.cleanup",
        target_type="audit_log",
        target_id=None,
        status="success",
        payload={"deleted": total_deleted},
        request_id=get_request_id(request),
        ip_address=get_request_ip(request),
    )
    return AuditCleanupOut(deleted=total_deleted)


@router.get("/api/team-events", response_model=list[TeamEventOut])
def list_team_events(current_user: User = Depends(require_team_personal_access), db: Session = Depends(get_db)):
    events = db.scalars(select(TeamEvent).where(TeamEvent.owner_id == current_user.id).order_by(TeamEvent.created_at.desc())).all()
    return [team_event_to_out(item) for item in events]


@router.post("/api/team-events", response_model=TeamEventOut)
def create_team_event(payload: TeamEventIn, current_user: User = Depends(require_team_personal_access), db: Session = Depends(get_db)):
    event = TeamEvent(
        owner_id=current_user.id,
        title=payload.title,
        event_date=parse_date(payload.eventDate),
        description=payload.description,
        owner=payload.owner,
        location=payload.location,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return team_event_to_out(event)


@router.delete("/api/team-events/{event_id}")
def delete_team_event(event_id: str, current_user: User = Depends(require_team_personal_access), db: Session = Depends(get_db)):
    event = db.scalar(select(TeamEvent).where(TeamEvent.id == event_id, TeamEvent.owner_id == current_user.id))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"ok": True}


@router.delete("/api/team-events")
def delete_team_events_by_date(eventDate: str, current_user: User = Depends(require_team_personal_access), db: Session = Depends(get_db)):
    target_date = parse_date(eventDate)
    events = db.scalars(select(TeamEvent).where(TeamEvent.owner_id == current_user.id, TeamEvent.event_date == target_date)).all()
    for item in events:
        db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/api/tickets/mine", response_model=list[TicketOut])
def list_my_tickets(current_user: User = Depends(require_tickets_access), db: Session = Depends(get_db)):
    tickets = db.scalars(
        select(Ticket)
        .where(Ticket.requester_id == current_user.id)
        .order_by(Ticket.created_at.desc())
    ).all()
    return [ticket_to_out(item, db) for item in tickets]


@router.get("/api/tickets/mine/{ticket_id}", response_model=TicketOut)
def get_my_ticket(ticket_id: str, current_user: User = Depends(require_tickets_access), db: Session = Depends(get_db)):
    ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id, Ticket.requester_id == current_user.id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket_to_out(ticket, db)


@router.get("/api/tickets/mine/{ticket_id}/events", response_model=list[TicketEventOut])
def list_my_ticket_events(ticket_id: str, current_user: User = Depends(require_tickets_access), db: Session = Depends(get_db)):
    ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id, Ticket.requester_id == current_user.id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    events = db.scalars(
        select(TicketEvent).where(TicketEvent.ticket_id == ticket_id).order_by(TicketEvent.created_at.asc())
    ).all()
    return [ticket_event_to_out(item, db) for item in events]


@router.delete("/api/tickets/mine/{ticket_id}")
def delete_my_ticket(ticket_id: str, current_user: User = Depends(require_tickets_access), db: Session = Depends(get_db)):
    ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id, Ticket.requester_id == current_user.id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    events = db.scalars(select(TicketEvent).where(TicketEvent.ticket_id == ticket_id)).all()
    for event in events:
        db.delete(event)
    db.delete(ticket)
    db.commit()
    return {"ok": True}


@router.post("/api/tickets/mine/bulk-delete", response_model=BulkDeleteOut)
def bulk_delete_my_tickets(payload: BulkIdsIn, current_user: User = Depends(require_tickets_access), db: Session = Depends(get_db)):
    requested_ids = [value for value in payload.ids if value]
    if not requested_ids:
        return BulkDeleteOut(deleted=0)
    unique_ids = list(dict.fromkeys(requested_ids))
    tickets = db.scalars(select(Ticket).where(Ticket.id.in_(unique_ids), Ticket.requester_id == current_user.id)).all()
    ticket_ids = [ticket.id for ticket in tickets]
    if ticket_ids:
        events = db.scalars(select(TicketEvent).where(TicketEvent.ticket_id.in_(ticket_ids))).all()
        for event in events:
            db.delete(event)
    for ticket in tickets:
        db.delete(ticket)
    db.commit()
    return BulkDeleteOut(deleted=len(ticket_ids))


@router.post("/api/tickets", response_model=TicketOut)
def create_ticket(payload: TicketIn, current_user: User = Depends(require_tickets_access), db: Session = Depends(get_db)):
    category = normalize_ticket_category(payload.category)
    priority = normalize_ticket_priority(payload.priority)
    now = datetime.now(timezone.utc)
    first_due, resolution_due = calculate_ticket_deadlines(priority, now)
    ticket = Ticket(
        requester_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=category,
        priority=priority,
        status="new",
        process_notes="",
        evidence_json="[]",
        first_response_due_at=first_due,
        resolution_due_at=resolution_due,
    )
    db.add(ticket)
    db.flush()
    log_ticket_event(
        db,
        ticket,
        current_user.id,
        "created",
        {"status": ticket.status, "priority": priority, "category": category},
    )
    db.commit()
    db.refresh(ticket)
    return ticket_to_out(ticket, db)


@router.get("/api/tickets/open", response_model=list[TicketOut])
def list_open_tickets(_: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    tickets = db.scalars(
        select(Ticket)
        .where(Ticket.status.in_(TICKET_ACTIVE_STATUSES))
        .order_by(Ticket.created_at.asc())
    ).all()
    return [ticket_to_out(item, db) for item in tickets]


@router.get("/api/tickets/open-unassigned", response_model=list[TicketOut])
def list_open_unassigned_tickets(_: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    tickets = db.scalars(
        select(Ticket)
        .where(Ticket.status.in_(TICKET_ACTIVE_STATUSES), Ticket.assignee_id.is_(None))
        .order_by(Ticket.created_at.asc())
    ).all()
    return [ticket_to_out(item, db) for item in tickets]


@router.get("/api/tickets/assigned-mine", response_model=list[TicketOut])
def list_assigned_my_tickets(current_user: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    tickets = db.scalars(
        select(Ticket)
        .where(Ticket.assignee_id == current_user.id)
        .order_by(Ticket.updated_at.desc())
    ).all()
    return [ticket_to_out(item, db) for item in tickets]


@router.get("/api/tickets/assignable-users", response_model=list[TicketAssigneeOut])
def list_ticket_assignable_users(current_user: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    if current_user.role == UserRole.admin.value:
        items = db.scalars(
            select(User)
            .where(User.role.in_([UserRole.admin.value, UserRole.developer.value]))
            .order_by(User.email.asc())
        ).all()
    else:
        items = [current_user]
    return [TicketAssigneeOut(id=item.id, email=item.email, role=item.role) for item in items]


@router.get("/api/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: str, _: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket_to_out(ticket, db)


@router.patch("/api/tickets/{ticket_id}", response_model=TicketOut)
def patch_ticket(ticket_id: str, payload: TicketPatchIn, current_user: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    next_status = normalize_ticket_status(payload.status) if payload.status is not None else ticket.status
    validate_ticket_transition(ticket.status, next_status)
    previous_status = ticket.status
    ticket.status = next_status
    ticket.resolution = payload.resolution
    if payload.assigneeId is not None:
        requested_assignee_id = payload.assigneeId if payload.assigneeId != "" else None
        validate_assignment_permission(current_user, requested_assignee_id)
        if payload.assigneeId == "":
            ticket.assignee_id = None
        else:
            assignee = db.get(User, payload.assigneeId)
            if not assignee:
                raise HTTPException(status_code=404, detail="Assignee not found")
            if assignee.role not in (UserRole.admin.value, UserRole.developer.value):
                raise HTTPException(status_code=400, detail="Assignee must be admin or developer")
            ticket.assignee_id = assignee.id
    if payload.processNotes is not None:
        ticket.process_notes = payload.processNotes
    if payload.evidence is not None:
        normalized_evidence: list[dict[str, str | None]] = []
        for item in payload.evidence:
            image_data = item.imageData.strip() if item.imageData else None
            if image_data and not image_data.startswith("data:image/"):
                raise HTTPException(status_code=400, detail="evidence imageData must be a data:image/* URL")
            normalized_evidence.append(
                {
                    "id": item.id.strip() or str(uuid.uuid4()),
                    "text": item.text.strip(),
                    "imageData": image_data,
                    "imageName": item.imageName.strip() if item.imageName else None,
                    "createdAt": item.createdAt or to_iso(datetime.now(timezone.utc)),
                }
            )
        ticket.evidence_json = json.dumps(normalized_evidence)
    now = datetime.now(timezone.utc)
    if ticket.status in ("in_progress", "triaged") and ticket.first_responded_at is None:
        ticket.first_responded_at = now
    if ticket.status == "resolved":
        ticket.resolved_at = now
        ticket.closed_at = None
    if ticket.status == "closed":
        ticket.closed_at = now
    if ticket.status == "reopened":
        ticket.resolved_at = None
        ticket.closed_at = None
    ticket.updated_at = datetime.now(timezone.utc)
    ticket.fixed_by_id = current_user.id if ticket.status in ("in_progress", "resolved", "closed") else None
    log_ticket_event(
        db,
        ticket,
        current_user.id,
        "updated",
        {
            "previousStatus": previous_status,
            "status": ticket.status,
            "assigneeId": ticket.assignee_id,
        },
    )
    db.commit()
    db.refresh(ticket)
    return ticket_to_out(ticket, db)


@router.patch("/api/tickets/{ticket_id}/assign", response_model=TicketOut)
def assign_ticket(ticket_id: str, payload: TicketAssignIn, current_user: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    validate_assignment_permission(current_user, payload.assigneeId)
    if payload.assigneeId is None:
        ticket.assignee_id = None
    else:
        assignee = db.get(User, payload.assigneeId)
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")
        if assignee.role not in (UserRole.admin.value, UserRole.developer.value):
            raise HTTPException(status_code=400, detail="Assignee must be admin or developer")
        ticket.assignee_id = assignee.id
    ticket.updated_at = datetime.now(timezone.utc)
    log_ticket_event(db, ticket, current_user.id, "assigned", {"assigneeId": ticket.assignee_id})
    db.commit()
    db.refresh(ticket)
    return ticket_to_out(ticket, db)


@router.get("/api/tickets/{ticket_id}/events", response_model=list[TicketEventOut])
def list_ticket_events(ticket_id: str, _: User = Depends(require_team_tickets_access), db: Session = Depends(get_db)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    events = db.scalars(
        select(TicketEvent).where(TicketEvent.ticket_id == ticket_id).order_by(TicketEvent.created_at.asc())
    ).all()
    return [ticket_event_to_out(item, db) for item in events]


@router.get("/api/maintenance-records", response_model=list[MaintenanceRecordOut])
def list_maintenance_records(current_user: User = Depends(require_team_work_access), db: Session = Depends(get_db)):
    if current_user.role in (UserRole.admin.value, UserRole.developer.value):
        records = db.scalars(select(MaintenanceRecord).order_by(MaintenanceRecord.created_at.desc())).all()
    else:
        records = db.scalars(
            select(MaintenanceRecord).where(MaintenanceRecord.owner_id == current_user.id).order_by(MaintenanceRecord.created_at.desc())
        ).all()
    return [maintenance_to_out(item) for item in records]


@router.post("/api/maintenance-records", response_model=MaintenanceRecordOut)
def create_maintenance_record(payload: MaintenanceRecordIn, current_user: User = Depends(require_team_work_access), db: Session = Depends(get_db)):
    maintenance_type = payload.maintenanceType.upper()
    if maintenance_type not in ("P", "C"):
        raise HTTPException(status_code=400, detail="maintenanceType must be P or C")

    record = MaintenanceRecord(
        owner_id=current_user.id,
        maintenance_date=parse_date(payload.maintenanceDate),
        qr=payload.qr.upper(),
        brand=payload.brand.upper(),
        model=payload.model.upper(),
        user_name=payload.user.upper(),
        serial_number=payload.serialNumber.upper(),
        consecutive=payload.consecutive.upper(),
        maintenance_type=maintenance_type,
        location=payload.location.upper(),
        responsible_name=username_from_email(current_user.email),
    )
    for item in payload.checks:
        record.checks.append(
            MaintenanceCheck(
                id=item.id,
                label=item.label,
                category=item.category,
                checked=item.checked,
                observation=item.observation.upper(),
            )
        )

    db.add(record)
    db.flush()
    matched_asset = db.scalar(select(Asset).where(Asset.qr_code == record.qr))
    if not matched_asset:
        matched_asset = db.scalar(select(Asset).where(Asset.serial_number == record.serial_number))
    if matched_asset:
        log_asset_event(
            db,
            matched_asset.id,
            current_user.id,
            "maintenance_recorded",
            {
                "maintenanceRecordId": record.id,
                "maintenanceType": record.maintenance_type,
                "maintenanceDate": record.maintenance_date.isoformat(),
                "responsibleName": record.responsible_name,
            },
        )
    db.commit()
    db.refresh(record)
    return maintenance_to_out(record)


@router.delete("/api/maintenance-records/{record_id}")
def delete_maintenance_record(record_id: str, current_user: User = Depends(require_team_work_access), db: Session = Depends(get_db)):
    if current_user.role in (UserRole.admin.value, UserRole.developer.value):
        record = db.scalar(select(MaintenanceRecord).where(MaintenanceRecord.id == record_id))
    else:
        record = db.scalar(select(MaintenanceRecord).where(MaintenanceRecord.id == record_id, MaintenanceRecord.owner_id == current_user.id))
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    db.delete(record)
    db.commit()
    return {"ok": True}


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


def _normalize_consecutive_4(value: str) -> str:
    source = _normalize_upper(value)
    if source.startswith("TDC-"):
        source = source[4:]
    digits = "".join(ch for ch in source if ch.isdigit())
    if not digits:
        return "0000"
    return digits.zfill(4)[-4:]


@router.post("/api/maintenance/export")
async def export_maintenance(
    template: UploadFile = File(...),
    payload: str = Form(...),
    current_user: User = Depends(require_team_work_access),
    db: Session = Depends(get_db),
):
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

    existing_record = db.scalar(
        select(MaintenanceRecord).where(
            MaintenanceRecord.id == str(record["id"]),
            MaintenanceRecord.owner_id == current_user.id,
        )
    )
    if not existing_record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    maintenance_type = _normalize_upper(str(record["maintenanceType"]))
    if maintenance_type not in ("P", "C"):
        raise HTTPException(status_code=400, detail="maintenanceType must be P or C")

    brand = _normalize_upper(str(record["brand"]))
    model = _normalize_upper(str(record["model"]))
    qr = _normalize_upper(str(record["qr"]))
    user_name = _normalize_upper(str(record["user"]))
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
        workbook = load_workbook(io.BytesIO(template_bytes), keep_vba=lower_name.endswith(".xlsm"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Could not open template workbook") from exc

    sheet = workbook[workbook.sheetnames[0]]
    sheet["L3"] = brand
    sheet["D5"] = qr
    sheet["D6"] = model
    sheet["S6"] = serial_number
    sheet["D7"] = user_name
    sheet["S7"] = date_value
    sheet["J8"] = responsible_name
    sheet["S8"] = location

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
    file_consecutive = _normalize_consecutive_4(consecutive)
    extension = ".xlsm" if lower_name.endswith(".xlsm") else ".xlsx"
    filename = f"TDC-{file_brand}_{file_model}_{file_serial}_{file_consecutive}{maintenance_type}{extension}"
    encoded_filename = quote(filename)
    content_disposition = f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}"

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


