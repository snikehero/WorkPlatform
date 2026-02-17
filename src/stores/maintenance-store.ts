import { apiRequest } from "@/lib/api";
import type { MaintenanceCheck, MaintenanceRecord } from "@/types/maintenance-record";

const toUpper = (value: string) => value.toLocaleUpperCase("es-MX");

type AddMaintenanceRecordInput = {
  maintenanceDate: string;
  qr: string;
  brand: string;
  model: string;
  user: string;
  serialNumber: string;
  consecutive: string;
  maintenanceType: "P" | "C";
  location: string;
  responsibleName: string;
  checks: MaintenanceCheck[];
};

export const maintenanceStore = {
  all: () => apiRequest<MaintenanceRecord[]>("/api/maintenance-records"),
  add: (input: AddMaintenanceRecordInput) =>
    apiRequest<MaintenanceRecord>("/api/maintenance-records", {
      method: "POST",
      body: JSON.stringify({
        maintenanceDate: input.maintenanceDate,
        qr: toUpper(input.qr),
        brand: toUpper(input.brand),
        model: toUpper(input.model),
        user: toUpper(input.user),
        serialNumber: toUpper(input.serialNumber),
        consecutive: toUpper(input.consecutive),
        maintenanceType: input.maintenanceType,
        location: toUpper(input.location),
        responsibleName: toUpper(input.responsibleName),
        checks: input.checks.map((check) => ({
          ...check,
          observation: toUpper(check.observation),
        })),
      }),
    }),
  remove: (recordId: string) =>
    apiRequest<{ ok: boolean }>(`/api/maintenance-records/${recordId}`, { method: "DELETE" }),
};
