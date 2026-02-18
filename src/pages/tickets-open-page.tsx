import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ticketStore } from "@/stores/ticket-store";
import { useAuthStore } from "@/stores/auth-store";
import type { Ticket } from "@/types/ticket";
import { useI18n } from "@/i18n/i18n";

export const TicketsOpenPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const currentUserEmail = useAuthStore.getState().userEmail;
  const currentUserRole = useAuthStore.getState().role;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadTickets = async () => {
    const data = await ticketStore.openUnassigned();
    setTickets(data);
  };

  useEffect(() => {
    loadTickets().catch(() => setTickets([]));
  }, []);

  const assignToMe = async (ticketId: string) => {
    try {
      const users = await ticketStore.assignableUsers();
      const normalizedCurrentEmail = (currentUserEmail ?? "").trim().toLowerCase();
      const mine =
        users.find((user) => user.email.trim().toLowerCase() === normalizedCurrentEmail) ??
        (currentUserRole === "developer" && users.length === 1 ? users[0] : undefined);
      if (!mine) {
        setMessage(t("tickets.assignSelfFailed"));
        return;
      }
      await ticketStore.assign(ticketId, mine.id);
      await loadTickets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("tickets.assignSelfFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tickets.openPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("tickets.openPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.openTitle")}</CardTitle>
          <CardDescription>{t("tickets.openSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("tickets.openEmpty")}</p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="rounded-md border border-border bg-card p-3">
                  <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("tickets.requesterPrefix")}: {ticket.requesterEmail} | {t("tickets.categoryPrefix")}: {ticket.category.toUpperCase()} | {t("tickets.priorityPrefix")}: {ticket.priority.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">SLA: {ticket.slaState}</p>
                  {ticket.description ? <p className="mt-1 text-xs text-muted-foreground">{ticket.description}</p> : null}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => assignToMe(ticket.id)}>
                      {t("tickets.assignToMe")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      {t("tickets.openSolution")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
