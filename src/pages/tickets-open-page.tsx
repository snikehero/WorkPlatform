import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { useToast } from "@/components/ui/toast";
import { ticketStore } from "@/stores/ticket-store";
import { useAuthStore } from "@/stores/auth-store";
import { formatTicketSlaState } from "@/lib/ticket-sla";
import type { Ticket } from "@/types/ticket";
import { useI18n } from "@/i18n/i18n";

export const TicketsOpenPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUserEmail = useAuthStore.getState().userEmail;
  const currentUserRole = useAuthStore.getState().role;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTickets = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = await ticketStore.openUnassigned();
      setTickets(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("tickets.openEmpty"));
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const assignToMe = async (ticketId: string) => {
    try {
      const users = await ticketStore.assignableUsers();
      const normalizedCurrentEmail = (currentUserEmail ?? "").trim().toLowerCase();
      const mine =
        users.find((user) => user.email.trim().toLowerCase() === normalizedCurrentEmail) ??
        (currentUserRole === "developer" && users.length === 1 ? users[0] : undefined);
      if (!mine) {
        showToast(t("tickets.assignSelfFailed"), "error");
        return;
      }
      await ticketStore.assign(ticketId, mine.id);
      showToast(t("tickets.assigned"), "success");
      await loadTickets();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("tickets.assignSelfFailed"), "error");
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
          {isLoading ? <LoadingState /> : null}
          {!isLoading && loadError ? <ErrorState label={loadError} onRetry={loadTickets} /> : null}
          {!isLoading && !loadError && tickets.length === 0 ? <EmptyState label={t("tickets.openEmpty")} /> : null}
          {!isLoading && !loadError && tickets.length > 0 ? (
            <ul className="space-y-3">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="rounded-md border border-border bg-card p-3">
                  <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("tickets.requesterPrefix")}: {ticket.requesterEmail} | {t("tickets.categoryPrefix")}: {ticket.category.toUpperCase()} | {t("tickets.priorityPrefix")}: {ticket.priority.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tickets.serviceTimingLabel")}: {formatTicketSlaState(t, ticket.slaState)}
                  </p>
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
