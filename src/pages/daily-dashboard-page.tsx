import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { taskStore } from "@/stores/task-store";
import { noteStore } from "@/stores/note-store";
import { ticketStore } from "@/stores/ticket-store";
import { teamEventStore } from "@/stores/team-event-store";
import { notificationStore } from "@/stores/notification-store";
import { useAuthStore } from "@/stores/auth-store";
import { moduleAccessStore } from "@/stores/module-access-store";
import type { Task } from "@/types/task";
import type { Note } from "@/types/note";
import type { Ticket } from "@/types/ticket";
import type { TeamEvent } from "@/types/team-event";
import type { AppNotification } from "@/types/notification";
import { useI18n } from "@/i18n/i18n";

export const DailyDashboardPage = () => {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const role = useAuthStore.getState().role;
  const [moduleAccess, setModuleAccess] = useState(moduleAccessStore.getState().modules);
  const canAccessTeam = role === "admin" || role === "developer";
  const canAccessPersonal = moduleAccess.personal;
  const canAccessWork = moduleAccess.work;
  const canAccessTickets = moduleAccess.tickets;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadData = async () => {
    const [taskResult, noteResult, ticketResult, eventResult, notificationResult] = await Promise.allSettled([
      canAccessPersonal ? taskStore.all() : Promise.resolve([]),
      canAccessPersonal ? noteStore.all() : Promise.resolve([]),
      canAccessTickets ? ticketStore.mine() : Promise.resolve([]),
      canAccessPersonal && canAccessTeam ? teamEventStore.all() : Promise.resolve([]),
      canAccessWork ? notificationStore.all() : Promise.resolve([]),
    ]);

    setTasks(taskResult.status === "fulfilled" ? taskResult.value : []);
    setNotes(noteResult.status === "fulfilled" ? noteResult.value : []);
    setTickets(ticketResult.status === "fulfilled" ? ticketResult.value : []);
    setEvents(eventResult.status === "fulfilled" ? eventResult.value : []);
    setNotifications(notificationResult.status === "fulfilled" ? notificationResult.value : []);
  };

  useEffect(() => {
    const unsubscribe = moduleAccessStore.subscribe((state) => setModuleAccess(state.modules));
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadData().catch(() => {
      setTasks([]);
      setNotes([]);
      setTickets([]);
      setEvents([]);
      setNotifications([]);
    });
  }, [canAccessTeam, canAccessPersonal, canAccessTickets, canAccessWork]);

  const todayTasks = useMemo(() => tasks.filter((task) => task.taskDate === today), [tasks, today]);
  const todayNotes = useMemo(() => notes.filter((note) => note.noteDate === today), [notes, today]);
  const openTickets = useMemo(() => tickets.filter((ticket) => !["resolved", "closed"].includes(ticket.status)), [tickets]);
  const overdueTasks = useMemo(
    () => tasks.filter((task) => task.taskDate < today && task.status !== "done"),
    [tasks, today]
  );
  const upcomingEvents = useMemo(
    () => events.filter((event) => event.eventDate >= today).sort((a, b) => a.eventDate.localeCompare(b.eventDate)).slice(0, 5),
    [events, today]
  );
  const activeReminders = useMemo(
    () =>
      notifications
        .filter((item) => !item.read && (item.category === "reminder" || (item.dueDate !== null && item.dueDate <= today)))
        .slice(0, 5),
    [notifications, today]
  );

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("dashboard.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.pageSubtitle")}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {canAccessPersonal ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dashboard.todayTasks")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{todayTasks.length}</p>
            </CardContent>
          </Card>
        ) : null}
        {canAccessPersonal ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dashboard.todayNotes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{todayNotes.length}</p>
            </CardContent>
          </Card>
        ) : null}
        {canAccessTickets ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dashboard.openTickets")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{openTickets.length}</p>
            </CardContent>
          </Card>
        ) : null}
        {canAccessPersonal ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dashboard.overdueTasks")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{overdueTasks.length}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {canAccessWork ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.remindersTitle")}</CardTitle>
              <CardDescription>{t("dashboard.remindersSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {activeReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashboard.emptyReminders")}</p>
              ) : (
                <ul className="space-y-2">
                  {activeReminders.map((item) => (
                    <li key={item.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.message ? <p className="text-xs text-muted-foreground">{item.message}</p> : null}
                      <div className="mt-2">
                        <Badge variant={item.category === "warning" ? "warning" : item.category === "reminder" ? "info" : "neutral"}>
                          {item.category.toUpperCase()}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {canAccessPersonal && canAccessTeam ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.upcomingEventsTitle")}</CardTitle>
              <CardDescription>{t("dashboard.upcomingEventsSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashboard.emptyEvents")}</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <li key={event.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.eventDate}</p>
                      {event.location ? <p className="text-xs text-muted-foreground">{event.location}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {canAccessPersonal ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.overdueTitle")}</CardTitle>
              <CardDescription>{t("dashboard.overdueSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashboard.emptyOverdue")}</p>
              ) : (
                <ul className="space-y-2">
                  {overdueTasks.map((task) => (
                    <li key={task.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.taskDate}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};
