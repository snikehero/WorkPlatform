export type NotificationCategory = "info" | "reminder" | "warning";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  dueDate: string | null;
  read: boolean;
  createdAt: string;
};
