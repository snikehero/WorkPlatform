import { apiRequest } from "@/lib/api";
import type { TeamEvent } from "@/types/team-event";

export const teamEventStore = {
  all: () => apiRequest<TeamEvent[]>("/api/team-events"),
  add: (title: string, eventDate: string, description: string, owner: string, location: string) =>
    apiRequest<TeamEvent>("/api/team-events", {
      method: "POST",
      body: JSON.stringify({ title, eventDate, description, owner, location }),
    }),
  removeByDate: (eventDate: string) =>
    apiRequest<{ ok: boolean }>(`/api/team-events?eventDate=${encodeURIComponent(eventDate)}`, {
      method: "DELETE",
    }),
  remove: (eventId: string) =>
    apiRequest<{ ok: boolean }>(`/api/team-events/${eventId}`, { method: "DELETE" }),
};
