import { apiRequest } from "@/lib/api";
import type { AppNotification, NotificationCategory } from "@/types/notification";

export const notificationStore = {
  all: () => apiRequest<AppNotification[]>("/api/notifications"),
  add: (title: string, message: string, category: NotificationCategory, dueDate: string | null) =>
    apiRequest<AppNotification>("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ title, message, category, dueDate }),
    }),
  markRead: (notificationId: string, read: boolean) =>
    apiRequest<{ ok: boolean }>(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      body: JSON.stringify({ read }),
    }),
  remove: (notificationId: string) =>
    apiRequest<{ ok: boolean }>(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    }),
};
