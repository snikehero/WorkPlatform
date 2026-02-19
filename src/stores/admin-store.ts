import { apiRequest } from "@/lib/api";
import type { AppModule, AppRole, RoleModuleAccess } from "@/types/module-access";
import type { AppUser } from "@/types/user";

export type AdminUserActivationLink = {
  userId: string;
  email: string;
  activationToken: string;
  activationExpiresAt: string;
};

export const adminStore = {
  allUsers: () => apiRequest<AppUser[]>("/api/admin/users"),
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
  allModuleAccess: () => apiRequest<RoleModuleAccess[]>("/api/admin/module-access"),
  updateModuleAccess: (role: AppRole, module: AppModule, enabled: boolean) =>
    apiRequest<RoleModuleAccess>(`/api/admin/module-access/${role}/${module}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
};
