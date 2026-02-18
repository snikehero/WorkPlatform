export type AssetStatus = "active" | "maintenance" | "retired" | "lost";

export type Asset = {
  id: string;
  assetTag: string;
  qrCode: string;
  location: string;
  serialNumber: string;
  category: string;
  manufacturer: string;
  model: string;
  supplier: string;
  status: AssetStatus;
  user: string;
  condition: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
