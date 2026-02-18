from pydantic import BaseModel, Field

try:
    from .models import UserRole
except ImportError:
    from models import UserRole

class AuthRegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.user


class AuthLoginIn(BaseModel):
    email: str
    password: str


class AuthOut(BaseModel):
    token: str
    user_email: str
    role: str
    preferred_language: str


class AdminUserOut(BaseModel):
    id: str
    email: str
    role: str
    preferredLanguage: str
    createdAt: str


class AdminCreateUserIn(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.user


class AdminUpdateUserIn(BaseModel):
    email: str
    role: UserRole


class AdminResetPasswordIn(BaseModel):
    password: str = Field(min_length=6, max_length=128)


class PersonIn(BaseModel):
    name: str
    email: str = ""
    title: str = ""
    role: UserRole = UserRole.user
    department: str = ""
    mobile: str = ""
    notes: str = ""


class PersonOut(BaseModel):
    id: str
    userId: str | None
    userEmail: str | None
    legacyId: int | None
    name: str
    email: str
    title: str
    role: str
    department: str
    mobile: str
    notes: str
    createdAt: str
    updatedAt: str


class ProjectIn(BaseModel):
    name: str
    description: str = ""


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    createdAt: str


class TaskIn(BaseModel):
    title: str
    details: str = ""
    projectId: str | None = None
    taskDate: str


class TaskStatusPatch(BaseModel):
    status: str


class TaskOut(BaseModel):
    id: str
    title: str
    details: str
    status: str
    projectId: str | None
    taskDate: str
    createdAt: str


class NoteIn(BaseModel):
    title: str
    content: str = ""
    noteDate: str


class NoteOut(BaseModel):
    id: str
    title: str
    content: str
    noteDate: str
    createdAt: str


class TeamEventIn(BaseModel):
    title: str
    eventDate: str
    description: str = ""
    owner: str = ""
    location: str = ""


class TeamEventOut(BaseModel):
    id: str
    title: str
    eventDate: str
    description: str
    owner: str
    location: str
    createdAt: str


class TicketIn(BaseModel):
    title: str
    description: str = ""
    category: str = "help"
    priority: str = "medium"


class TicketEvidenceIn(BaseModel):
    id: str
    text: str = ""
    imageData: str | None = None
    imageName: str | None = None
    createdAt: str | None = None


class TicketEvidenceOut(BaseModel):
    id: str
    text: str
    imageData: str | None
    imageName: str | None
    createdAt: str


class TicketPatchIn(BaseModel):
    status: str | None = None
    assigneeId: str | None = None
    resolution: str = ""
    processNotes: str | None = None
    evidence: list[TicketEvidenceIn] | None = None


class TicketAssignIn(BaseModel):
    assigneeId: str | None = None


class TicketOut(BaseModel):
    id: str
    requesterId: str
    requesterEmail: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    resolution: str
    processNotes: str
    evidence: list[TicketEvidenceOut]
    assigneeId: str | None
    assigneeEmail: str | None
    slaState: str
    firstResponseDueAt: str | None
    resolutionDueAt: str | None
    firstRespondedAt: str | None
    resolvedAt: str | None
    closedAt: str | None
    fixedById: str | None
    fixedByEmail: str | None
    createdAt: str
    updatedAt: str


class TicketEventOut(BaseModel):
    id: str
    ticketId: str
    actorId: str | None
    actorEmail: str | None
    eventType: str
    payload: dict[str, object]
    createdAt: str


class TicketAssigneeOut(BaseModel):
    id: str
    email: str
    role: str


class MaintenanceCheckPayload(BaseModel):
    id: str
    label: str
    category: str
    checked: bool
    observation: str = ""


class MaintenanceRecordIn(BaseModel):
    maintenanceDate: str
    qr: str
    brand: str
    model: str
    user: str
    serialNumber: str
    consecutive: str
    maintenanceType: str
    location: str
    responsibleName: str
    checks: list[MaintenanceCheckPayload]


class MaintenanceRecordOut(BaseModel):
    id: str
    maintenanceDate: str
    qr: str
    brand: str
    model: str
    user: str
    serialNumber: str
    consecutive: str
    maintenanceType: str
    location: str
    responsibleName: str
    checks: list[MaintenanceCheckPayload]
    createdAt: str


class NotificationIn(BaseModel):
    title: str
    message: str = ""
    category: str = "info"
    dueDate: str | None = None


class NotificationReadPatchIn(BaseModel):
    read: bool


class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    category: str
    dueDate: str | None
    read: bool
    createdAt: str


class KnowledgeArticleIn(BaseModel):
    title: str
    summary: str = ""
    content: str = ""
    tags: list[str] = []


class KnowledgeArticleOut(BaseModel):
    id: str
    title: str
    summary: str
    content: str
    tags: list[str]
    createdAt: str
    updatedAt: str


class AssetIn(BaseModel):
    assetTag: str = ""
    qrCode: str = ""
    qrClass: str = "A"
    location: str = ""
    serialNumber: str = ""
    category: str = ""
    manufacturer: str = ""
    model: str = ""
    supplier: str = ""
    status: str = "active"
    user: str = ""
    condition: str = ""
    notes: str = ""


class AssetOut(BaseModel):
    id: str
    assetTag: str
    qrCode: str
    location: str
    serialNumber: str
    category: str
    manufacturer: str
    model: str
    supplier: str
    status: str
    user: str
    condition: str
    notes: str
    createdAt: str
    updatedAt: str


class ChangePasswordIn(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=6, max_length=128)


class LanguagePreferenceIn(BaseModel):
    preferredLanguage: str
