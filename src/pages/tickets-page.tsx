import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ticketStore } from "@/stores/ticket-store";
import { useAuthStore } from "@/stores/auth-store";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/types/ticket";
import { useI18n } from "@/i18n/i18n";

export const TicketsPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const role = useAuthStore.getState().role;
  const canCheckTickets = role === "admin" || role === "developer";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("help");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState<string | null>(null);

  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [resolutionById, setResolutionById] = useState<Record<string, string>>({});

  const loadData = async () => {
    const mine = await ticketStore.mine();
    setMyTickets(mine);
    if (canCheckTickets) {
      const open = await ticketStore.open();
      setOpenTickets(open);
    } else {
      setOpenTickets([]);
    }
  };

  useEffect(() => {
    loadData().catch(() => {
      setMyTickets([]);
      setOpenTickets([]);
    });
  }, [canCheckTickets]);

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!title.trim()) {
      setMessage(t("tickets.requiredTitle"));
      return;
    }
    try {
      await ticketStore.add(title.trim(), description.trim(), category, priority);
      setTitle("");
      setDescription("");
      setCategory("help");
      setPriority("medium");
      setMessage(t("tickets.created"));
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("tickets.createFailed"));
    }
  };

  const handleUpdateTicket = async (ticketId: string, status: TicketStatus) => {
    const resolution = resolutionById[ticketId] ?? "";
    await ticketStore.update(ticketId, status, resolution);
    await loadData();
  };

  const myOpenCount = useMemo(() => myTickets.filter((item) => item.status !== "resolved").length, [myTickets]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tickets.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("tickets.pageSubtitle")}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("tickets.assignTitle")}</CardTitle>
            <CardDescription>{t("tickets.assignSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateTicket}>
              <div className="space-y-2">
                <Label htmlFor="ticket-title">{t("common.title")}</Label>
                <Input
                  id="ticket-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("tickets.titlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-category">{t("common.category")}</Label>
                <Select
                  id="ticket-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as TicketCategory)}
                >
                  <option value="help">{t("tickets.category.help")}</option>
                  <option value="printer">{t("tickets.category.printer")}</option>
                  <option value="network">{t("tickets.category.network")}</option>
                  <option value="software">{t("tickets.category.software")}</option>
                  <option value="hardware">{t("tickets.category.hardware")}</option>
                  <option value="access">{t("tickets.category.access")}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-priority">{t("common.priority")}</Label>
                <Select
                  id="ticket-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TicketPriority)}
                >
                  <option value="low">{t("tickets.priority.low")}</option>
                  <option value="medium">{t("tickets.priority.medium")}</option>
                  <option value="high">{t("tickets.priority.high")}</option>
                  <option value="critical">{t("tickets.priority.critical")}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-description">{t("common.description")}</Label>
                <Textarea
                  id="ticket-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("tickets.descriptionPlaceholder")}
                />
              </div>
              <Button type="submit">{t("tickets.create")}</Button>
            </form>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tickets.myTitle")}</CardTitle>
            <CardDescription>{t("tickets.myCounts", { open: myOpenCount, total: myTickets.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            {myTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("tickets.myEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {myTickets.map((ticket) => (
                  <li key={ticket.id} className="rounded-md border border-border bg-card p-3">
                    <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.category.toUpperCase()} | {ticket.priority.toUpperCase()} | {ticket.status}
                    </p>
                    {ticket.status === "in_progress" && ticket.fixedByEmail ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("tickets.inProgressBy")}: {ticket.fixedByEmail}
                      </p>
                    ) : null}
                    {ticket.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{ticket.description}</p>
                    ) : null}
                    {ticket.resolution ? (
                      <p className="mt-1 text-xs text-muted-foreground">{t("tickets.resolutionPrefix")}: {ticket.resolution}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {canCheckTickets ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("tickets.checkTitle")}</CardTitle>
            <CardDescription>{t("tickets.checkSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {openTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("tickets.openEmpty")}</p>
            ) : (
              <ul className="space-y-3">
                {openTickets.map((ticket) => (
                  <li key={ticket.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("tickets.requesterPrefix")}: {ticket.requesterEmail} | {t("tickets.categoryPrefix")}: {ticket.category.toUpperCase()} | {t("tickets.priorityPrefix")}: {ticket.priority.toUpperCase()} | {t("tickets.statusPrefix")}: {ticket.status}
                        </p>
                        {ticket.status === "in_progress" && ticket.fixedByEmail ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("tickets.inProgressBy")}: {ticket.fixedByEmail}
                          </p>
                        ) : null}
                        {ticket.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">{ticket.description}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                          {t("tickets.openSolution")}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleUpdateTicket(ticket.id, "in_progress")}>
                          {t("tickets.markInProgress")}
                        </Button>
                        <Button size="sm" onClick={() => handleUpdateTicket(ticket.id, "resolved")}>
                          {t("tickets.resolve")}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label htmlFor={`resolution-${ticket.id}`}>{t("tickets.resolutionNotes")}</Label>
                      <Textarea
                        id={`resolution-${ticket.id}`}
                        className="mt-1"
                        value={resolutionById[ticket.id] ?? ticket.resolution ?? ""}
                        onChange={(event) =>
                          setResolutionById((current) => ({
                            ...current,
                            [ticket.id]: event.target.value,
                          }))
                        }
                        placeholder={t("tickets.resolutionPlaceholder")}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
