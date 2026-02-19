import { apiRequest } from "@/lib/api";
import type { AppModule, AppRole, RoleModuleAccess } from "@/types/module-access";
import type { AdminUserListResponse, AppUser } from "@/types/user";

export type AdminUserActivationLink = {
  userId: string;
  email: string;
  activationToken: string;
  activationExpiresAt: string;
};

type ListUsersParams = {
  search?: string;
  role?: "admin" | "developer" | "user" | "";
  sortBy?: "createdAt" | "email" | "role";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

const buildUserListQuery = (params: ListUsersParams) => {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role) query.set("role", params.role);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return query.toString();
};

export const adminStore = {
  allUsers: () => apiRequest<AppUser[]>("/api/admin/users"),
  listUsers: (params: ListUsersParams) => {
    const query = buildUserListQuery(params);
    return apiRequest<AdminUserListResponse>(`/api/admin/users/list${query ? `?${query}` : ""}`);
  },
  createUser: (email: string, password: string, role: "admin" | "developer" | "user") =>
    apiRequest<AppUser>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),
  updateUser: (id: string, email: string, role: "admin" | "developer" | "user") =>
    apiRequest<AppUser>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ email, role }),
    }),
  resetPassword: (id: string, password: string) =>
    apiRequest<{ ok: boolean }>(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  generateActivationLink: (id: string) =>
    apiRequest<AdminUserActivationLink>(`/api/admin/users/${id}/activation-link`, {
      method: "POST",
    }),
  deleteUser: (id: string) =>
    apiRequest<{ ok: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" }),
  bulkDeleteUsers: (ids: string[]) =>
    apiRequest<{ deleted: number }>("/api/admin/users/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
  allModuleAccess: () => apiRequest<RoleModuleAccess[]>("/api/admin/module-access"),
  updateModuleAccess: (role: AppRole, module: AppModule, enabled: boolean) =>
    apiRequest<RoleModuleAccess>(`/api/admin/module-access/${role}/${module}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
};
