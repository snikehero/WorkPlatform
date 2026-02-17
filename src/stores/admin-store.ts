import { apiRequest } from "@/lib/api";
import type { AppUser } from "@/types/user";

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
  deleteUser: (id: string) =>
    apiRequest<{ ok: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" }),
};
