import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notificationStore } from "@/stores/notification-store";
import type { AppNotification, NotificationCategory } from "@/types/notification";
import { useI18n } from "@/i18n/i18n";

export const NotificationsPage = () => {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("reminder");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadItems = async () => {
    const data = await notificationStore.all();
    setItems(data);
  };

  useEffect(() => {
    loadItems().catch(() => setItems([]));
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    if (!title.trim()) {
      setStatusMessage(t("notifications.titleRequired"));
      return;
    }
    try {
      await notificationStore.add(
        title.trim(),
        message.trim(),
        category,
        dueDate.trim() ? dueDate.trim() : null
      );
      setTitle("");
      setMessage("");
      setCategory("reminder");
      setDueDate("");
      setStatusMessage(t("notifications.created"));
      await loadItems();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t("notifications.createFailed"));
    }
  };

  const handleToggleRead = async (notification: AppNotification) => {
    await notificationStore.markRead(notification.id, !notification.read);
    await loadItems();
  };

  const handleDelete = async (notificationId: string) => {
    await notificationStore.remove(notificationId);
    await loadItems();
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("notifications.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("notifications.pageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.createTitle")}</CardTitle>
          <CardDescription>{t("notifications.createSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="notification-title">{t("common.title")}</Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("notifications.titlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-category">{t("common.category")}</Label>
              <Select
                id="notification-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as NotificationCategory)}
              >
                <option value="reminder">{t("notifications.category.reminder")}</option>
                <option value="info">{t("notifications.category.info")}</option>
                <option value="warning">{t("notifications.category.warning")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-due">{t("notifications.dueDate")}</Label>
              <Input
                id="notification-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="notification-message">{t("common.description")}</Label>
              <Textarea
                id="notification-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("notifications.messagePlaceholder")}
              />
            </div>
            <div>
              <Button type="submit">{t("notifications.create")}</Button>
            </div>
          </form>
          {statusMessage ? <p className="mt-3 text-sm text-muted-foreground">{statusMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.inboxTitle")}</CardTitle>
          <CardDescription>{t("notifications.inboxSubtitle", { unread: unreadCount, total: items.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      {item.message ? <p className="text-xs text-muted-foreground">{item.message}</p> : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={item.category === "warning" ? "warning" : item.category === "reminder" ? "info" : "neutral"}>
                          {item.category.toUpperCase()}
                        </Badge>
                        <Badge variant={item.read ? "success" : "warning"}>
                          {item.read ? t("notifications.read") : t("notifications.unread")}
                        </Badge>
                        {item.dueDate ? <span className="text-xs text-muted-foreground">{t("notifications.dueLabel")}: {item.dueDate}</span> : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleToggleRead(item)}>
                        {item.read ? t("notifications.markUnread") : t("notifications.markRead")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
