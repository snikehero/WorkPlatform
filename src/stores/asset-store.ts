import { apiRequest } from "@/lib/api";
import type { Asset, AssetStatus } from "@/types/asset";

type AssetPayload = {
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
};

export const assetStore = {
  all: () => apiRequest<Asset[]>("/api/assets"),
  add: (payload: AssetPayload) =>
    apiRequest<Asset>("/api/assets", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (assetId: string, payload: AssetPayload) =>
    apiRequest<Asset>(`/api/assets/${assetId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (assetId: string) =>
    apiRequest<{ ok: boolean }>(`/api/assets/${assetId}`, {
      method: "DELETE",
    }),
};
