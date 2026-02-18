import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { ticketStore } from "@/stores/ticket-store";
import type { Ticket } from "@/types/ticket";
import { useI18n } from "@/i18n/i18n";
import { useAuthStore } from "@/stores/auth-store";

export const TicketsMyPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const role = useAuthStore.getState().role;
  const isTeamUser = role === "admin" || role === "developer";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [developerFilter, setDeveloperFilter] = useState<"assigned" | "closed">("assigned");
  const [userFilter, setUserFilter] = useState<"active" | "closed">("active");

  const loadTickets = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = isTeamUser ? await ticketStore.assignedMine() : await ticketStore.mine();
      setTickets(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("tickets.myEmpty"));
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [isTeamUser]);

  const filteredTickets = useMemo(() => {
    if (!isTeamUser) return tickets;
    if (developerFilter === "closed") return tickets.filter((item) => item.status === "closed");
    return tickets.filter((item) => item.status !== "closed");
  }, [developerFilter, isTeamUser, tickets]);

  const visibleTickets = useMemo(() => {
    if (isTeamUser) return filteredTickets;
    if (userFilter === "closed") return tickets.filter((item) => item.status === "closed");
    return tickets.filter((item) => item.status !== "closed");
  }, [filteredTickets, isTeamUser, tickets, userFilter]);

  const openCount = useMemo(() => visibleTickets.filter((item) => !["resolved", "closed"].includes(item.status)).length, [visibleTickets]);

  const handleDeleteMine = async (ticketId: string) => {
    const shouldDelete = window.confirm(t("tickets.deleteConfirm"));
    if (!shouldDelete) return;
    try {
      await ticketStore.deleteMine(ticketId);
      await loadTickets();
      showToast(t("tickets.deleted"), "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("tickets.deleteFailed"), "error");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tickets.myPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{isTeamUser ? t("tickets.myPageSubtitle") : t("tickets.myRequestedPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.myTitle")}</CardTitle>
          <CardDescription>{t("tickets.myCounts", { open: openCount, total: visibleTickets.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          {isTeamUser ? (
            <div className="mb-4 max-w-52">
              <Select value={developerFilter} onChange={(event) => setDeveloperFilter(event.target.value as "assigned" | "closed")}>
                <option value="assigned">{t("tickets.filterAssigned")}</option>
                <option value="closed">{t("tickets.filterClosed")}</option>
              </Select>
            </div>
          ) : (
            <div className="mb-4 max-w-52">
              <Select value={userFilter} onChange={(event) => setUserFilter(event.target.value as "active" | "closed")}>
                <option value="active">{t("tickets.filterActive")}</option>
                <option value="closed">{t("tickets.filterClosed")}</option>
              </Select>
            </div>
          )}
          {isLoading ? <LoadingState /> : null}
          {!isLoading && loadError ? <ErrorState label={loadError} onRetry={loadTickets} /> : null}
          {!isLoading && !loadError && visibleTickets.length === 0 ? <EmptyState label={t("tickets.myEmpty")} /> : null}
          {!isLoading && !loadError && visibleTickets.length > 0 ? (
            <ul className="space-y-2">
              {visibleTickets.map((ticket) => (
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(isTeamUser ? `/tickets/${ticket.id}` : `/tickets/my/${ticket.id}`)}
                      >
                        {isTeamUser ? t("tickets.openSolution") : t("tickets.viewDetails")}
                      </Button>
                      {!isTeamUser ? (
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteMine(ticket.id)}>
                          {t("tickets.delete")}
                        </Button>
                      ) : null}
                    </div>
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
