import { apiRequest } from "@/lib/api";
import type { ManagedPerson } from "@/types/person";

type PersonPayload = {
  name: string;
  email: string;
  title: string;
  role: string;
  department: string;
  mobile: string;
  notes: string;
};

export const peopleStore = {
  all: () => apiRequest<ManagedPerson[]>("/api/admin/people"),
  add: (payload: PersonPayload) =>
    apiRequest<ManagedPerson>("/api/admin/people", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (personId: string, payload: PersonPayload) =>
    apiRequest<ManagedPerson>(`/api/admin/people/${personId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (personId: string) =>
    apiRequest<{ ok: boolean }>(`/api/admin/people/${personId}`, {
      method: "DELETE",
    }),
};
