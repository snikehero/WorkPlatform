import { apiRequest } from "@/lib/api";
import type { Ticket, TicketCategory, TicketEvidence, TicketPriority, TicketStatus } from "@/types/ticket";

export const ticketStore = {
  mine: () => apiRequest<Ticket[]>("/api/tickets/mine"),
  open: () => apiRequest<Ticket[]>("/api/tickets/open"),
  byId: (ticketId: string) => apiRequest<Ticket>(`/api/tickets/${ticketId}`),
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
    evidence?: TicketEvidence[]
  ) =>
    apiRequest<Ticket>(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        resolution,
        ...(processNotes !== undefined ? { processNotes } : {}),
        ...(evidence !== undefined ? { evidence } : {}),
      }),
    }),
};
