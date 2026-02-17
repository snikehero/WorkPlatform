export type MaintenanceCategory = "hardware" | "software";

export type MaintenanceCheck = {
  id: string;
  label: string;
  category: MaintenanceCategory;
  checked: boolean;
  observation: string;
};

export type MaintenanceRecord = {
  id: string;
  qr: string;
  brand: string;
  model: string;
  user: string;
  serialNumber: string;
  consecutive: string;
  maintenanceType: "P" | "C";
  maintenanceDate: string;
  location: string;
  responsibleName: string;
  checks: MaintenanceCheck[];
  createdAt: string;
};
