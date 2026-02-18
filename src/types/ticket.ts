export type TicketStatus = "new" | "triaged" | "in_progress" | "waiting_user" | "blocked" | "resolved" | "closed" | "reopened";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketCategory = "printer" | "help" | "network" | "software" | "hardware" | "access";

export type TicketEvidence = {
  id: string;
  text: string;
  imageData: string | null;
  imageName: string | null;
  createdAt: string;
};

export type Ticket = {
  id: string;
  requesterId: string;
  requesterEmail: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  resolution: string;
  processNotes: string;
  evidence: TicketEvidence[];
  assigneeId: string | null;
  assigneeEmail: string | null;
  slaState: "on_track" | "at_risk" | "breached" | "completed";
  firstResponseDueAt: string | null;
  resolutionDueAt: string | null;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  fixedById: string | null;
  fixedByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketEvent = {
  id: string;
  ticketId: string;
  actorId: string | null;
  actorEmail: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type TicketAssignee = {
  id: string;
  email: string;
  role: "admin" | "developer" | "user";
};
