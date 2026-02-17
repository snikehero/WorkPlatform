import { apiRequest } from "@/lib/api";
import type { Project } from "@/types/project";

export const projectStore = {
  all: () => apiRequest<Project[]>("/api/projects"),
  add: (name: string, description: string) =>
    apiRequest<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  remove: (projectId: string) =>
    apiRequest<{ ok: boolean }>(`/api/projects/${projectId}`, { method: "DELETE" }),
};
