import { apiRequest } from "@/lib/api";
import type { Ticket, TicketAssignee, TicketCategory, TicketEvidence, TicketEvent, TicketPriority, TicketStatus } from "@/types/ticket";

export const ticketStore = {
  mine: () => apiRequest<Ticket[]>("/api/tickets/mine"),
  mineById: (ticketId: string) => apiRequest<Ticket>(`/api/tickets/mine/${ticketId}`),
  mineEvents: (ticketId: string) => apiRequest<TicketEvent[]>(`/api/tickets/mine/${ticketId}/events`),
  openUnassigned: () => apiRequest<Ticket[]>("/api/tickets/open-unassigned"),
  assignedMine: () => apiRequest<Ticket[]>("/api/tickets/assigned-mine"),
  assignableUsers: () => apiRequest<TicketAssignee[]>("/api/tickets/assignable-users"),
  byId: (ticketId: string) => apiRequest<Ticket>(`/api/tickets/${ticketId}`),
  events: (ticketId: string) => apiRequest<TicketEvent[]>(`/api/tickets/${ticketId}/events`),
  add: (title: string, description: string, category: TicketCategory, priority: TicketPriority) =>
    apiRequest<Ticket>("/api/tickets", {
      method: "POST",
      body: JSON.stringify({ title, description, category, priority }),
    }),
  update: (
    ticketId: string,
    status: TicketStatus,
    resolution: string,
    processNotes?: string,
    evidence?: TicketEvidence[],
    assigneeId?: string | null
  ) =>
    apiRequest<Ticket>(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        resolution,
        ...(processNotes !== undefined ? { processNotes } : {}),
        ...(evidence !== undefined ? { evidence } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
      }),
    }),
  assign: (ticketId: string, assigneeId: string | null) =>
    apiRequest<Ticket>(`/api/tickets/${ticketId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId }),
    }),
};
