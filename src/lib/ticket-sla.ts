import type { Ticket } from "@/types/ticket";

const SLA_STATE_LABEL_KEYS: Record<Ticket["slaState"], string> = {
  on_track: "tickets.serviceTimingState.onTrack",
  at_risk: "tickets.serviceTimingState.atRisk",
  breached: "tickets.serviceTimingState.breached",
  completed: "tickets.serviceTimingState.completed",
};

export const formatTicketSlaState = (
  t: (key: string, params?: Record<string, string | number>) => string,
  state: Ticket["slaState"]
) => t(SLA_STATE_LABEL_KEYS[state]);
