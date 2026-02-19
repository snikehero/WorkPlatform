import { apiRequest } from "@/lib/api";
import type { ManagedPerson, PeopleListResponse } from "@/types/person";

type PersonPayload = {
  name: string;
  email: string;
  title: string;
  role: string;
  department: string;
  mobile: string;
  notes: string;
};

type ListPeopleParams = {
  search?: string;
  role?: "admin" | "developer" | "user" | "";
  department?: string;
  sortBy?: "name" | "email" | "role" | "department" | "updatedAt" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

const buildPeopleListQuery = (params: ListPeopleParams) => {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role) query.set("role", params.role);
  if (params.department?.trim()) query.set("department", params.department.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return query.toString();
};

export const peopleStore = {
  all: () => apiRequest<ManagedPerson[]>("/api/admin/people"),
  list: (params: ListPeopleParams) => {
    const query = buildPeopleListQuery(params);
    return apiRequest<PeopleListResponse>(`/api/admin/people/list${query ? `?${query}` : ""}`);
  },
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
  bulkRemove: (ids: string[]) =>
    apiRequest<{ deleted: number }>("/api/admin/people/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
};
