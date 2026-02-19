import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

try:
    from .core import Base, DEFAULT_ROLE_MODULE_ACCESS, MODULE_NAMES, RoleModuleAccess, SessionLocal, User, UserRole, engine, hash_password
except ImportError:
    from core import Base, DEFAULT_ROLE_MODULE_ACCESS, MODULE_NAMES, RoleModuleAccess, SessionLocal, User, UserRole, engine, hash_password


app = FastAPI(title="WorkPlatform API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_set_password BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token_hash VARCHAR(128)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_expires_at TIMESTAMPTZ"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_activation_token_hash ON users (activation_token_hash)"))
        conn.execute(text("UPDATE users SET must_set_password = FALSE WHERE must_set_password IS NULL"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'help'"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS process_notes TEXT DEFAULT ''"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS evidence_json TEXT DEFAULT '[]'"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assignee_id VARCHAR(36)"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_due_at TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_due_at TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_responded_at TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tickets_assignee_id ON tickets (assignee_id)"))
        conn.execute(text("UPDATE tickets SET status = 'new' WHERE status = 'open'"))
        conn.execute(text("ALTER TABLE assets ADD COLUMN IF NOT EXISTS qr_code VARCHAR(250) DEFAULT ''"))
        conn.execute(text("ALTER TABLE assets ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(120) DEFAULT ''"))
        conn.execute(text("ALTER TABLE assets ADD COLUMN IF NOT EXISTS model VARCHAR(120) DEFAULT ''"))
        conn.execute(text("ALTER TABLE assets ADD COLUMN IF NOT EXISTS supplier VARCHAR(120) DEFAULT ''"))
        conn.execute(text("ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_name VARCHAR(250) DEFAULT ''"))
        conn.execute(text("ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition VARCHAR(120) DEFAULT ''"))
        conn.execute(text("UPDATE assets SET user_name = 'Unassigned' WHERE btrim(coalesce(user_name, '')) = ''"))
        conn.execute(text("UPDATE assets SET assigned_to = 'Unassigned' WHERE btrim(coalesce(assigned_to, '')) = ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS legacy_id INTEGER"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'user'"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS role_id INTEGER DEFAULT 2"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS client_id INTEGER DEFAULT 1"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS name VARCHAR(128) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS email VARCHAR(128) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS title VARCHAR(128) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS role VARCHAR(128) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS job_department VARCHAR(128) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS mobile VARCHAR(100) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS password_hash_legacy VARCHAR(128) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS theme VARCHAR(64) DEFAULT 'skin-blue'"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS sidebar VARCHAR(64) DEFAULT 'opened'"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS layout VARCHAR(64) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS signature TEXT DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS session_id VARCHAR(255) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS reset_key VARCHAR(255) DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS auto_refresh INTEGER DEFAULT 0"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS lang VARCHAR(5) DEFAULT 'en'"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS tickets_notification BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS avatar_info TEXT DEFAULT ''"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()"))
        conn.execute(text("ALTER TABLE people ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()"))
    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.email == "admin@workplatform.local"))
        if not existing:
            bootstrap_password = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "").strip()
            if not bootstrap_password:
                raise RuntimeError("ADMIN_BOOTSTRAP_PASSWORD is required for initial admin bootstrap")
            admin = User(
                email="admin@workplatform.local",
                password_hash=hash_password(bootstrap_password),
                role=UserRole.admin.value,
                preferred_language="en",
                must_set_password=False,
            )
            db.add(admin)
            db.flush()
        for role_name, modules in DEFAULT_ROLE_MODULE_ACCESS.items():
            for module_name in MODULE_NAMES:
                existing_rule = db.scalar(
                    select(RoleModuleAccess).where(
                        RoleModuleAccess.role == role_name,
                        RoleModuleAccess.module == module_name,
                    )
                )
                if existing_rule:
                    continue
                db.add(
                    RoleModuleAccess(
                        role=role_name,
                        module=module_name,
                        enabled=bool(modules.get(module_name, True)),
                    )
                )
        db.commit()


try:
    from .api import router as api_router
except ImportError:
    from api import router as api_router

app.include_router(api_router)
