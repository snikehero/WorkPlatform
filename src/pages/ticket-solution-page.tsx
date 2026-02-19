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
import { formatTicketSlaState } from "@/lib/ticket-sla";
import { ticketStore } from "@/stores/ticket-store";
import type { Ticket, TicketAssignee, TicketEvidence, TicketEvent, TicketStatus } from "@/types/ticket";

type ProcessFieldKey = "issueContext" | "diagnostics" | "rootCause" | "fixApplied" | "validation" | "followUp";

type ProcessDraft = Record<ProcessFieldKey, string>;

type ProcessFieldConfig = {
  key: ProcessFieldKey;
  labelKey: string;
  hintKey: string;
  placeholderKey: string;
  required: boolean;
  minChars: number;
  sectionTitle: string;
};

const PROCESS_FIELDS: ProcessFieldConfig[] = [
  {
    key: "issueContext",
    labelKey: "tickets.fieldIssueContext",
    hintKey: "tickets.fieldIssueContextHint",
    placeholderKey: "tickets.fieldIssueContextPlaceholder",
    required: true,
    minChars: 20,
    sectionTitle: "Issue Context",
  },
  {
    key: "diagnostics",
    labelKey: "tickets.fieldDiagnostics",
    hintKey: "tickets.fieldDiagnosticsHint",
    placeholderKey: "tickets.fieldDiagnosticsPlaceholder",
    required: true,
    minChars: 20,
    sectionTitle: "Diagnostics Run",
  },
  {
    key: "rootCause",
    labelKey: "tickets.fieldRootCause",
    hintKey: "tickets.fieldRootCauseHint",
    placeholderKey: "tickets.fieldRootCausePlaceholder",
    required: true,
    minChars: 15,
    sectionTitle: "Root Cause",
  },
  {
    key: "fixApplied",
    labelKey: "tickets.fieldFixApplied",
    hintKey: "tickets.fieldFixAppliedHint",
    placeholderKey: "tickets.fieldFixAppliedPlaceholder",
    required: true,
    minChars: 20,
    sectionTitle: "Fix Applied",
  },
  {
    key: "validation",
    labelKey: "tickets.fieldValidation",
    hintKey: "tickets.fieldValidationHint",
    placeholderKey: "tickets.fieldValidationPlaceholder",
    required: true,
    minChars: 20,
    sectionTitle: "Validation",
  },
  {
    key: "followUp",
    labelKey: "tickets.fieldFollowUp",
    hintKey: "tickets.fieldFollowUpHint",
    placeholderKey: "tickets.fieldFollowUpPlaceholder",
    required: false,
    minChars: 0,
    sectionTitle: "Follow-up / Prevention",
  },
];

const EMPTY_PROCESS_DRAFT: ProcessDraft = {
  issueContext: "",
  diagnostics: "",
  rootCause: "",
  fixApplied: "",
  validation: "",
  followUp: "",
};

const RESOLUTION_MIN_CHARS = 20;

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

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseStructuredProcessNotes = (rawValue: string): ProcessDraft => {
  const raw = (rawValue || "").trim();
  if (!raw) return { ...EMPTY_PROCESS_DRAFT };
  const next: ProcessDraft = { ...EMPTY_PROCESS_DRAFT };
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
    // Backward compatibility: old tickets had one freeform process notes field.
    next.issueContext = raw;
  }
  return next;
};

const buildStructuredProcessNotes = (draft: ProcessDraft): string => {
  const sections: string[] = [];
  for (let index = 0; index < PROCESS_FIELDS.length; index += 1) {
    const field = PROCESS_FIELDS[index];
    const value = draft[field.key].trim();
    if (!value) continue;
    sections.push(`### ${index + 1}) ${field.sectionTitle}\n${value}`);
  }
  return sections.join("\n\n");
};

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
  const [processDraft, setProcessDraft] = useState<ProcessDraft>({ ...EMPTY_PROCESS_DRAFT });
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
    setProcessDraft(parseStructuredProcessNotes(item.processNotes ?? ""));
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

  const fieldCompletion = useMemo(
    () =>
      PROCESS_FIELDS.map((field) => {
        const trimmed = processDraft[field.key].trim();
        return {
          ...field,
          done: field.required ? trimmed.length >= field.minChars : true,
          chars: trimmed.length,
        };
      }),
    [processDraft]
  );

  const resolutionDone = resolution.trim().length >= RESOLUTION_MIN_CHARS;
  const evidenceDone = nonEmptyEvidenceCount > 0;
  const missingResolveItems = useMemo(() => {
    const missing: string[] = [];
    for (const field of fieldCompletion) {
      if (field.required && !field.done) {
        missing.push(t(field.labelKey));
      }
    }
    if (!resolutionDone) missing.push(t("tickets.checkResolution"));
    if (!evidenceDone) missing.push(t("tickets.checkEvidence"));
    return missing;
  }, [evidenceDone, fieldCompletion, resolutionDone, t]);

  const canResolve = missingResolveItems.length === 0;

  const processNotesPayload = useMemo(() => buildStructuredProcessNotes(processDraft), [processDraft]);

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

  const saveTicketProgress = async (status: TicketStatus, enforceResolveChecklist: boolean) => {
    if (!ticket) return;
    if (enforceResolveChecklist && status === "resolved" && !canResolve) {
      const errorMessage = t("tickets.resolveNeedsProcessFields", { fields: missingResolveItems.join(", ") });
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await ticketStore.update(ticket.id, status, resolution.trim(), processNotesPayload.trim(), evidence);
      setTicket(updated);
      setEvidence(updated.evidence ?? []);
      setProcessDraft(parseStructuredProcessNotes(updated.processNotes ?? ""));
      setResolution(updated.resolution ?? "");
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

  const handleStatusUpdate = async (status: TicketStatus) => {
    await saveTicketProgress(status, true);
  };

  const handleSaveDraft = async () => {
    if (!ticket) return;
    await saveTicketProgress(ticket.status, false);
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
          <p className="text-xs text-muted-foreground">
            {t("tickets.serviceTimingLabel")}: {formatTicketSlaState(t, ticket.slaState)}
          </p>
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

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.resolveChecklistTitle")}</CardTitle>
          <CardDescription>{t("tickets.resolveChecklistSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {fieldCompletion
            .filter((field) => field.required)
            .map((field) => (
              <div key={field.key} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                <span>{t(field.labelKey)}</span>
                <Badge variant={field.done ? "success" : "warning"}>{field.done ? t("tickets.completeStep") : t("tickets.requiredStep")}</Badge>
              </div>
            ))}
          <div className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
            <span>{t("tickets.checkResolution")}</span>
            <Badge variant={resolutionDone ? "success" : "warning"}>{resolutionDone ? t("tickets.completeStep") : t("tickets.requiredStep")}</Badge>
          </div>
          <div className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
            <span>{t("tickets.checkEvidence")}</span>
            <Badge variant={evidenceDone ? "success" : "warning"}>{evidenceDone ? t("tickets.completeStep") : t("tickets.requiredStep")}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.processTitle")}</CardTitle>
          <CardDescription>{t("tickets.processSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fieldCompletion.map((field, index) => (
            <div key={field.key} className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`ticket-process-${field.key}`}>{`${index + 1}. ${t(field.labelKey)}`}</Label>
                {field.required ? (
                  <Badge variant={field.done ? "success" : "warning"}>{field.done ? t("tickets.completeStep") : t("tickets.requiredStep")}</Badge>
                ) : (
                  <Badge variant="neutral">{t("common.optional")}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t(field.hintKey)}</p>
              <Textarea
                id={`ticket-process-${field.key}`}
                value={processDraft[field.key]}
                onChange={(event) => setProcessDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                className="min-h-28"
                placeholder={t(field.placeholderKey)}
              />
              {field.required ? (
                <p className="text-xs text-muted-foreground">{t("tickets.charProgress", { count: String(field.chars), min: String(field.minChars) })}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.evidenceTitle")}</CardTitle>
          <CardDescription>{t("tickets.evidenceSubtitle", { count: nonEmptyEvidenceCount })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("tickets.evidenceHint")}</p>
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
          <CardDescription>{t("tickets.resolutionHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ticket-solution-resolution">{t("tickets.resolutionNotes")}</Label>
            <Textarea
              id="ticket-solution-resolution"
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              className="min-h-28"
              placeholder={t("tickets.resolutionPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("tickets.charProgress", { count: String(resolution.trim().length), min: String(RESOLUTION_MIN_CHARS) })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isSaving} variant="secondary" onClick={handleSaveDraft}>
              {t("tickets.saveDraft")}
            </Button>
            <Button disabled={isSaving} variant="ghost" onClick={() => handleStatusUpdate("triaged")}>
              Triage
            </Button>
            <Button disabled={isSaving} variant="secondary" onClick={() => handleStatusUpdate("in_progress")}>
              {t("tickets.markInProgress")}
            </Button>
            <Button disabled={isSaving || !canResolve} onClick={() => handleStatusUpdate("resolved")}>
              {t("tickets.resolve")}
            </Button>
            <Button disabled={isSaving} variant="ghost" onClick={() => handleStatusUpdate("closed")}>
              Close
            </Button>
            <Button disabled={isSaving} variant="ghost" onClick={() => handleStatusUpdate("reopened")}>
              {t("tickets.reopen")}
            </Button>
          </div>
          {!canResolve ? <p className="text-xs text-muted-foreground">{t("tickets.resolveNotReady")}</p> : <p className="text-xs text-emerald-600">{t("tickets.resolveReady")}</p>}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
