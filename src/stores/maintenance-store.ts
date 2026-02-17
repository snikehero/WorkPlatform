import { createId } from "@/lib/id";
import type { MaintenanceCheck, MaintenanceRecord } from "@/types/maintenance-record";

const MAINTENANCE_KEY = "workplatform-pc-maintenance";

const loadRecords = (): MaintenanceRecord[] => {
  const raw = localStorage.getItem(MAINTENANCE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as MaintenanceRecord[];
    return parsed.map((record) => ({
      ...record,
      qr: (record.qr ?? "").toUpperCase(),
      brand: record.brand ?? record.model?.split(/\s+/)[0] ?? "",
      model: (record.model ?? "").toUpperCase(),
      user: (record.user ?? "").toUpperCase(),
      serialNumber: (record.serialNumber ?? "").toUpperCase(),
      consecutive: (record.consecutive ?? "").toUpperCase(),
      maintenanceType: record.maintenanceType === "C" ? "C" : "P",
      location: (record.location ?? "").toUpperCase(),
      responsibleName: (record.responsibleName ?? "").toUpperCase(),
      checks: Array.isArray(record.checks)
        ? (record.checks as MaintenanceCheck[]).map((check) => ({
            ...check,
            observation: (check.observation ?? "").toUpperCase(),
          }))
        : [],
      maintenanceDate:
        record.maintenanceDate ??
        record.createdAt?.slice(0, 10) ??
        new Date().toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
};

let records: MaintenanceRecord[] = loadRecords();

const saveRecords = () => {
  localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(records));
};

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
  all: () => records,
  add: (input: AddMaintenanceRecordInput) => {
    const record: MaintenanceRecord = {
      id: createId(),
      qr: toUpper(input.qr),
      brand: toUpper(input.brand),
      model: toUpper(input.model),
      user: toUpper(input.user),
      serialNumber: toUpper(input.serialNumber),
      consecutive: toUpper(input.consecutive),
      maintenanceType: input.maintenanceType,
      maintenanceDate: input.maintenanceDate,
      location: toUpper(input.location),
      responsibleName: toUpper(input.responsibleName),
      checks: input.checks.map((check) => ({
        ...check,
        observation: toUpper(check.observation),
      })),
      createdAt: new Date().toISOString(),
    };

    records = [record, ...records];
    saveRecords();
    return record;
  },
  remove: (recordId: string) => {
    records = records.filter((record) => record.id !== recordId);
    saveRecords();
  },
};
