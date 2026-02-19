import { apiRequest, getApiBase, getAuthToken } from "@/lib/api";
import type { AuditLogFilters, AuditLogListResponse } from "@/types/audit";

const buildQueryString = (filters: AuditLogFilters, cursor?: string | null) => {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.actorEmail) params.set("actorEmail", filters.actorEmail);
  if (filters.action) params.set("action", filters.action);
  if (filters.targetType) params.set("targetType", filters.targetType);
  if (filters.targetId) params.set("targetId", filters.targetId);
  if (filters.status) params.set("status", filters.status);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", "50");
  return params.toString();
};

const parseDownloadError = async (response: Response) => {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload.detail) return payload.detail;
  } catch {
    const text = await response.text();
    if (text) return text;
  }
  return `Request failed (${response.status})`;
};

export const adminAuditStore = {
  list: (filters: AuditLogFilters, cursor?: string | null) => {
    const query = buildQueryString(filters, cursor);
    return apiRequest<AuditLogListResponse>(`/api/admin/audit-logs?${query}`);
  },
  exportCsv: async (filters: AuditLogFilters) => {
    const token = getAuthToken();
    const query = buildQueryString(filters, null);
    const response = await fetch(`${getApiBase()}/api/admin/audit-logs/export.csv?${query}`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      throw new Error(await parseDownloadError(response));
    }
    const blob = await response.blob();
    const fileName = `audit-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
  },
};
