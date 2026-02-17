export type TicketStatus = "open" | "in_progress" | "resolved";
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
  fixedById: string | null;
  fixedByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};
