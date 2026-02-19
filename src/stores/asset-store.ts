import { apiRequest } from "@/lib/api";
import type { Asset, AssetHistoryEvent, AssetStatus } from "@/types/asset";

type AssetPayload = {
  assetTag: string;
  qrCode: string;
  qrClass: "A" | "B" | "C";
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
};

export const assetStore = {
  all: () => apiRequest<Asset[]>("/api/assets"),
  history: (assetId: string) => apiRequest<AssetHistoryEvent[]>(`/api/assets/${assetId}/history`),
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
  bulkRemove: (ids: string[]) =>
    apiRequest<{ deleted: number }>("/api/assets/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
};
