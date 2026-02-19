export type AuditStatus = "success" | "failure";

export type AuditLog = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  status: AuditStatus;
  requestId: string;
  ipAddress: string | null;
  payload: Record<string, unknown>;
};

export type AuditLogListResponse = {
  items: AuditLog[];
  nextCursor: string | null;
};

export type AuditLogFilters = {
  from?: string;
  to?: string;
  actorEmail?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  status?: AuditStatus;
};
