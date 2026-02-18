import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ticketStore } from "@/stores/ticket-store";
import type { Ticket } from "@/types/ticket";
import { useI18n } from "@/i18n/i18n";
import { useAuthStore } from "@/stores/auth-store";

export const TicketsMyPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const role = useAuthStore.getState().role;
  const isTeamUser = role === "admin" || role === "developer";
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const loadTickets = async () => {
    const data = isTeamUser ? await ticketStore.assignedMine() : await ticketStore.mine();
    setTickets(data);
  };

  useEffect(() => {
    loadTickets().catch(() => setTickets([]));
  }, [isTeamUser]);

  const openCount = useMemo(() => tickets.filter((item) => !["resolved", "closed"].includes(item.status)).length, [tickets]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tickets.myPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{isTeamUser ? t("tickets.myPageSubtitle") : t("tickets.myRequestedPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.myTitle")}</CardTitle>
          <CardDescription>{t("tickets.myCounts", { open: openCount, total: tickets.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("tickets.myEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                    <Badge variant="info">{ticket.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ticket.category.toUpperCase()} | {ticket.priority.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">SLA: {ticket.slaState}</p>
                  {ticket.description ? <p className="mt-1 text-xs text-muted-foreground">{ticket.description}</p> : null}
                  {!isTeamUser ? (
                    <>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("tickets.handledByPrefix")}: {ticket.assigneeEmail ?? t("common.unassigned")}
                      </p>
                      {ticket.processNotes ? (
                        <p className="text-xs text-muted-foreground">{t("tickets.processPrefix")}: {ticket.processNotes}</p>
                      ) : null}
                      {ticket.resolution ? (
                        <p className="text-xs text-muted-foreground">{t("tickets.resolutionSummaryPrefix")}: {ticket.resolution}</p>
                      ) : null}
                    </>
                  ) : null}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(isTeamUser ? `/tickets/${ticket.id}` : `/tickets/my/${ticket.id}`)}
                    >
                      {isTeamUser ? t("tickets.openSolution") : t("tickets.viewDetails")}
                    </Button>
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
