import type { TeamEvent } from "@/types/team-event";

const EVENTS_KEY = "workplatform-team-events";

const loadEvents = (): TeamEvent[] => {
  const raw = localStorage.getItem(EVENTS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as TeamEvent[];
  } catch {
    return [];
  }
};

let events: TeamEvent[] = loadEvents();

const saveEvents = () => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export const teamEventStore = {
  all: () => events,
  add: (title: string, eventDate: string, description: string, owner: string, location: string) => {
    const event: TeamEvent = {
      id: crypto.randomUUID(),
      title,
      eventDate,
      description,
      owner,
      location,
      createdAt: new Date().toISOString(),
    };

    events = [event, ...events];
    saveEvents();
    return event;
  },
  removeByDate: (eventDate: string) => {
    events = events.filter((event) => event.eventDate !== eventDate);
    saveEvents();
  },
  remove: (eventId: string) => {
    events = events.filter((event) => event.id !== eventId);
    saveEvents();
  },
};
