import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamEvent } from "@/types/team-event";
import { format } from "date-fns";

type TeamEventListProps = {
  events: TeamEvent[];
  onDeleteEvent: (eventId: string) => void;
};

export const TeamEventList = ({ events, onDeleteEvent }: TeamEventListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Team Events</CardTitle>
        <CardDescription>Shared team commitments and reminders.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team events scheduled.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.eventDate), "PPP")}
                    </p>
                    {event.description ? (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {event.owner ? <span>Owner: {event.owner}</span> : null}
                      {event.location ? <span>Location: {event.location}</span> : null}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => onDeleteEvent(event.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
