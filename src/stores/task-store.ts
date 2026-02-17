import { apiRequest } from "@/lib/api";
import type { Task, TaskStatus } from "@/types/task";

export const taskStore = {
  all: () => apiRequest<Task[]>("/api/tasks"),
  add: (title: string, details: string, projectId: string | null, taskDate: string) =>
    apiRequest<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, details, projectId, taskDate }),
    }),
  updateStatus: (taskId: string, status: TaskStatus) =>
    apiRequest<{ ok: boolean }>(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (taskId: string) =>
    apiRequest<{ ok: boolean }>(`/api/tasks/${taskId}`, { method: "DELETE" }),
};
