import type { MaintenanceRecord } from "@/types/maintenance-record";

const DEFAULT_EXPORT_API = "http://localhost:8000/api/maintenance/export";
const EXPORT_API_URL =
  (import.meta.env.VITE_MAINTENANCE_EXPORT_API as string | undefined) ?? DEFAULT_EXPORT_API;
const AUTH_STORAGE_KEY = "workplatform-auth";

const resolveFilename = (headerValue: string | null, fallback: string) => {
  if (!headerValue) return fallback;
  const starMatch = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (starMatch?.[1]) {
    return decodeURIComponent(starMatch[1]);
  }
  const plainMatch = headerValue.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }
  return fallback;
};

const sanitizeToken = (value: string) =>
  value
    .toLocaleUpperCase("es-MX")
    .replace(/[^A-Z0-9-]/g, "");

const normalizeConsecutive4 = (value: string) => {
  const source = value.toLocaleUpperCase("es-MX").replace(/^TDC-/, "");
  const digits = source.replace(/\D/g, "");
  if (!digits) return "0000";
  return digits.padStart(4, "0").slice(-4);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportMaintenanceRecordToExcel = async (
  record: MaintenanceRecord,
  templateFile: File
) => {
  const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  let token: string | null = null;
  if (rawAuth) {
    try {
      const parsed = JSON.parse(rawAuth) as { token?: string };
      token = parsed.token ?? null;
    } catch {
      token = null;
    }
  }

  const body = new FormData();
  body.append("template", templateFile);
  body.append("payload", JSON.stringify(record));

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(EXPORT_API_URL, {
    method: "POST",
    body,
    headers,
  });

  if (!response.ok) {
    let message = "Failed to export maintenance report.";
    try {
      const parsed = (await response.json()) as { detail?: string };
      if (parsed.detail) {
        message = parsed.detail;
      }
    } catch {
      const errorText = await response.text();
      if (errorText) {
        message = errorText;
      }
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const extension = templateFile.name.toLowerCase().endsWith(".xlsm") ? ".xlsm" : ".xlsx";
  const brand = sanitizeToken(record.brand) || "NA";
  const model = sanitizeToken(record.model) || "NA";
  const serial = sanitizeToken(record.serialNumber) || "NA";
  const consecutive = normalizeConsecutive4(record.consecutive);
  const type = record.maintenanceType === "C" ? "C" : "P";
  const fallback = `TDC-${brand}_${model}_${serial}_${consecutive}${type}${extension}`;
  const filename = resolveFilename(response.headers.get("content-disposition"), fallback);
  downloadBlob(blob, filename);
};
