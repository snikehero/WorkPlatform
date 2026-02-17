export type AssetStatus = "active" | "maintenance" | "retired" | "lost";

export type Asset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  status: AssetStatus;
  assignedTo: string;
  serialNumber: string;
  location: string;
  purchaseDate: string | null;
  warrantyUntil: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
