import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { formatTicketSlaState } from "@/lib/ticket-sla";
import { ticketStore } from "@/stores/ticket-store";
import type { Ticket, TicketEvent } from "@/types/ticket";

type ProcessField = {
  key: "issueContext" | "diagnostics" | "rootCause" | "fixApplied" | "validation" | "followUp";
  labelKey: string;
  sectionTitle: string;
};

type ParsedProcess = Record<ProcessField["key"], string>;

const PROCESS_FIELDS: ProcessField[] = [
  { key: "issueContext", labelKey: "tickets.fieldIssueContext", sectionTitle: "Issue Context" },
  { key: "diagnostics", labelKey: "tickets.fieldDiagnostics", sectionTitle: "Diagnostics Run" },
  { key: "rootCause", labelKey: "tickets.fieldRootCause", sectionTitle: "Root Cause" },
  { key: "fixApplied", labelKey: "tickets.fieldFixApplied", sectionTitle: "Fix Applied" },
  { key: "validation", labelKey: "tickets.fieldValidation", sectionTitle: "Validation" },
  { key: "followUp", labelKey: "tickets.fieldFollowUp", sectionTitle: "Follow-up / Prevention" },
];

const EMPTY_PARSED_PROCESS: ParsedProcess = {
  issueContext: "",
  diagnostics: "",
  rootCause: "",
  fixApplied: "",
  validation: "",
  followUp: "",
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseStructuredProcessNotes = (rawValue: string): ParsedProcess => {
  const raw = (rawValue || "").trim();
  if (!raw) return { ...EMPTY_PARSED_PROCESS };
  const next: ParsedProcess = { ...EMPTY_PARSED_PROCESS };
  let foundStructuredSection = false;
  for (const field of PROCESS_FIELDS) {
    const regex = new RegExp(
      `###\\s*\\d+\\)\\s*${escapeRegExp(field.sectionTitle)}\\s*\\n([\\s\\S]*?)(?=\\n###\\s*\\d+\\)|$)`,
      "i"
    );
    const match = raw.match(regex);
    if (!match) continue;
    next[field.key] = match[1].trim();
    foundStructuredSection = true;
  }
  if (!foundStructuredSection) {
    next.issueContext = raw;
  }
  return next;
};

const getStatusVariant = (status: Ticket["status"]) => {
  if (status === "resolved" || status === "closed") return "success" as const;
  if (status === "in_progress") return "warning" as const;
  return "info" as const;
};

export const TicketsUserDetailPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { ticketId = "" } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [parsedProcess, setParsedProcess] = useState<ParsedProcess>({ ...EMPTY_PARSED_PROCESS });

  useEffect(() => {
    if (!ticketId) return;
    Promise.all([ticketStore.mineById(ticketId), ticketStore.mineEvents(ticketId)])
      .then(([item, eventItems]) => {
        setTicket(item);
        setEvents(eventItems);
        setParsedProcess(parseStructuredProcessNotes(item.processNotes ?? ""));
      })
      .catch((error) => {
        setTicket(null);
        setEvents([]);
        setParsedProcess({ ...EMPTY_PARSED_PROCESS });
        const errorMessage = error instanceof Error ? error.message : t("tickets.detailLoadFailed");
        setMessage(errorMessage);
        showToast(errorMessage, "error");
      });
  }, [showToast, ticketId, t]);

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate("/tickets/my")}>
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

  const handleDelete = async () => {
    const shouldDelete = window.confirm(t("tickets.deleteConfirm"));
    if (!shouldDelete) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      await ticketStore.deleteMine(ticket.id);
      showToast(t("tickets.deleted"), "success");
      navigate("/tickets/my");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("tickets.deleteFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tickets.userDetailTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("tickets.userDetailSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/tickets/my")}>
            {t("tickets.backToList")}
          </Button>
          <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            {t("tickets.delete")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ticket.title}</CardTitle>
          <CardDescription>
            {t("tickets.categoryPrefix")}: {ticket.category.toUpperCase()} | {t("tickets.priorityPrefix")}: {ticket.priority.toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
          <p className="text-xs text-muted-foreground">
            {t("tickets.serviceTimingLabel")}: {formatTicketSlaState(t, ticket.slaState)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("tickets.handledByPrefix")}: {ticket.assigneeEmail ?? t("common.unassigned")}
          </p>
          {ticket.description ? <p className="text-sm text-muted-foreground">{ticket.description}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.processTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PROCESS_FIELDS.map((field) => {
            const value = parsedProcess[field.key].trim();
            if (!value) return null;
            return (
              <div key={field.key} className="space-y-1 rounded-md border border-border p-3">
                <p className="text-xs font-medium text-foreground">{t(field.labelKey)}</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{value}</p>
              </div>
            );
          })}
          {!PROCESS_FIELDS.some((field) => Boolean(parsedProcess[field.key].trim())) ? (
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">-</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.resolutionNotes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{ticket.resolution || "-"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.evidenceTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ticket.evidence.length === 0 ? <p className="text-sm text-muted-foreground">{t("tickets.evidenceEmpty")}</p> : null}
          {ticket.evidence.map((item) => (
            <div key={item.id} className="space-y-2 rounded-md border border-border p-3">
              {item.text ? <p className="text-sm text-muted-foreground">{item.text}</p> : null}
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
          <CardTitle>{t("tickets.timelineTitle")}</CardTitle>
          <CardDescription>{t("tickets.timelineSubtitle")}</CardDescription>
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
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
};
