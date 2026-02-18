import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { ticketStore } from "@/stores/ticket-store";
import type { Ticket, TicketAssignee, TicketEvidence, TicketEvent, TicketStatus } from "@/types/ticket";

const getStatusVariant = (status: TicketStatus) => {
  if (status === "resolved" || status === "closed") return "success" as const;
  if (status === "in_progress") return "warning" as const;
  return "info" as const;
};

const createEvidenceItem = (): TicketEvidence => ({
  id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()),
  text: "",
  imageData: null,
  imageName: null,
  createdAt: new Date().toISOString(),
});

export const TicketSolutionPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { ticketId = "" } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<TicketAssignee[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [resolution, setResolution] = useState("");
  const [processNotes, setProcessNotes] = useState("");
  const [evidence, setEvidence] = useState<TicketEvidence[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadTicket = async () => {
    const [item, eventItems, users] = await Promise.all([ticketStore.byId(ticketId), ticketStore.events(ticketId), ticketStore.assignableUsers()]);
    setTicket(item);
    setAssignableUsers(users);
    setAssigneeId(item.assigneeId ?? "");
    setEvents(eventItems);
    setResolution(item.resolution ?? "");
    setProcessNotes(item.processNotes ?? "");
    setEvidence(item.evidence ?? []);
  };

  useEffect(() => {
    if (!ticketId) return;
    loadTicket().catch((error) => {
      setTicket(null);
      const errorMessage = error instanceof Error ? error.message : t("tickets.detailLoadFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    });
  }, [showToast, ticketId, t]);

  const nonEmptyEvidenceCount = useMemo(
    () => evidence.filter((item) => Boolean(item.text.trim()) || Boolean(item.imageData)).length,
    [evidence]
  );

  const handleUpdateEvidenceText = (id: string, value: string) => {
    setEvidence((current) => current.map((item) => (item.id === id ? { ...item, text: value } : item)));
  };

  const handleEvidenceImage = (id: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === "string" ? reader.result : null;
      setEvidence((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                imageData,
                imageName: file.name,
              }
            : item
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleStatusUpdate = async (status: TicketStatus) => {
    if (!ticket) return;
    if (status === "resolved" && !resolution.trim()) {
      const errorMessage = t("tickets.resolveNeedsResolution");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }
    if (status === "resolved" && nonEmptyEvidenceCount === 0) {
      const errorMessage = t("tickets.resolveNeedsEvidence");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await ticketStore.update(ticket.id, status, resolution.trim(), processNotes.trim(), evidence);
      setTicket(updated);
      setEvidence(updated.evidence ?? []);
      const eventItems = await ticketStore.events(ticket.id);
      setEvents(eventItems);
      const successMessage = t("tickets.detailSaved");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("tickets.createFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!ticket) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await ticketStore.assign(ticket.id, assigneeId || null);
      setTicket(updated);
      const eventItems = await ticketStore.events(ticket.id);
      setEvents(eventItems);
      const successMessage = t("tickets.detailSaved");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("tickets.createFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate("/tickets")}>
          {t("tickets.backToList")}
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{message ?? t("tickets.detailLoading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tickets.solveTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("tickets.solveSubtitle")}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/tickets")}>
          {t("tickets.backToList")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ticket.title}</CardTitle>
          <CardDescription>
            {t("tickets.requesterPrefix")}: {ticket.requesterEmail} | {t("tickets.categoryPrefix")}: {ticket.category.toUpperCase()} | {t("tickets.priorityPrefix")}: {ticket.priority.toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
          <p className="text-xs text-muted-foreground">SLA: {ticket.slaState}</p>
          <p className="text-xs text-muted-foreground">{ticket.assigneeEmail ? `Assignee: ${ticket.assigneeEmail}` : "Assignee: Unassigned"}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              <option value="">Unassigned</option>
              {assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </Select>
            <Button size="sm" variant="secondary" disabled={isSaving} onClick={handleAssign}>
              Assign
            </Button>
          </div>
          {ticket.description ? <p className="text-sm text-muted-foreground">{ticket.description}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Ticket status and assignment events.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : null}
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="rounded border border-border px-3 py-2 text-xs text-muted-foreground">
                <p>
                  {new Date(event.createdAt).toLocaleString()} | {event.eventType} | {event.actorEmail ?? "system"}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.processTitle")}</CardTitle>
          <CardDescription>{t("tickets.processSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="ticket-process-notes">{t("tickets.processNotes")}</Label>
          <Textarea
            id="ticket-process-notes"
            className="mt-1 min-h-40"
            value={processNotes}
            onChange={(event) => setProcessNotes(event.target.value)}
            placeholder={t("tickets.processPlaceholder")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.evidenceTitle")}</CardTitle>
          <CardDescription>{t("tickets.evidenceSubtitle", { count: nonEmptyEvidenceCount })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Button variant="secondary" size="sm" onClick={() => setEvidence((current) => [...current, createEvidenceItem()])}>
              {t("tickets.addEvidence")}
            </Button>
          </div>
          {evidence.length === 0 ? <p className="text-sm text-muted-foreground">{t("tickets.evidenceEmpty")}</p> : null}
          {evidence.map((item) => (
            <div key={item.id} className="space-y-2 rounded-md border border-border p-3">
              <Label htmlFor={`evidence-text-${item.id}`}>{t("tickets.evidenceText")}</Label>
              <Textarea
                id={`evidence-text-${item.id}`}
                value={item.text}
                onChange={(event) => handleUpdateEvidenceText(item.id, event.target.value)}
                placeholder={t("tickets.evidenceTextPlaceholder")}
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label={t("tickets.evidenceImage")}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleEvidenceImage(item.id, event.target.files?.[0] ?? null)}
                />
                {item.imageName ? <span className="text-xs text-muted-foreground">{item.imageName}</span> : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEvidence((current) =>
                      current.map((currentItem) =>
                        currentItem.id === item.id ? { ...currentItem, imageData: null, imageName: null } : currentItem
                      )
                    )
                  }
                >
                  {t("tickets.removeImage")}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setEvidence((current) => current.filter((x) => x.id !== item.id))}>
                  {t("tickets.removeEvidence")}
                </Button>
              </div>
              {item.imageData ? (
                <img
                  src={item.imageData}
                  alt={item.imageName ?? "evidence"}
                  className="max-h-56 rounded-md border border-border object-contain"
                />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.resolutionNotes")}</CardTitle>
          <CardDescription>{t("tickets.solveResolutionHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ticket-solution-resolution">{t("tickets.resolutionNotes")}</Label>
            <Textarea
              id="ticket-solution-resolution"
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              placeholder={t("tickets.resolutionPlaceholder")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isSaving} variant="ghost" onClick={() => handleStatusUpdate("triaged")}>
              Triage
            </Button>
            <Button disabled={isSaving} variant="secondary" onClick={() => handleStatusUpdate("in_progress")}>
              {t("tickets.markInProgress")}
            </Button>
            <Button disabled={isSaving} onClick={() => handleStatusUpdate("resolved")}>
              {t("tickets.resolve")}
            </Button>
            <Button disabled={isSaving} variant="ghost" onClick={() => handleStatusUpdate("closed")}>
              Close
            </Button>
            <Button disabled={isSaving} variant="ghost" onClick={() => handleStatusUpdate("reopened")}>
              {t("tickets.reopen")}
            </Button>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
