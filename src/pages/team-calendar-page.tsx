import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { teamEventStore } from "@/stores/team-event-store";
import { TeamEventForm } from "@/components/team-events/team-event-form";
import type { TeamEvent } from "@/types/team-event";
import { useI18n } from "@/i18n/i18n";

export const TeamCalendarPage = () => {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<TeamEvent[]>([]);

  const loadEvents = async () => {
    const data = await teamEventStore.all();
    setEvents(data);
  };

  useEffect(() => {
    loadEvents().catch(() => setEvents([]));
  }, []);

  const selectedDayEvents = useMemo(
    () => events.filter((event) => event.eventDate === selectedDate),
    [events, selectedDate]
  );
  const eventDates = useMemo(
    () => events.map((event) => new Date(`${event.eventDate}T00:00:00`)),
    [events]
  );

  const handleCreateEvent = async (
    title: string,
    eventDate: string,
    description: string,
    owner: string,
    location: string
  ) => {
    await teamEventStore.add(title, eventDate, description, owner, location);
    await loadEvents();
  };

  const handleClearSelectedDate = async () => {
    await teamEventStore.removeByDate(selectedDate);
    await loadEvents();
  };

  const calendarClassNames = {
    months: "flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    month_caption: "flex items-center justify-center pt-1 relative",
    caption_label: "text-sm font-medium",
    nav: "flex items-center justify-between",
    button_previous: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
    button_next: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
    month_grid: "w-full border-collapse space-y-1",
    weekdays: "flex",
    weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
    week: "flex w-full mt-2",
    day: "h-9 w-9 text-center text-sm p-0 relative",
    day_button: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("calendar.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("calendar.pageSubtitle")}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("calendar.monthlyView")}</CardTitle>
          <CardDescription>{t("calendar.selectDay")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            className="rounded-lg border"
            mode="single"
            selected={new Date(`${selectedDate}T00:00:00`)}
            onSelect={(date) => {
              if (!date) return;
              setSelectedDate(format(date, "yyyy-MM-dd"));
            }}
            classNames={calendarClassNames}
            modifiers={{ event: eventDates }}
            modifiersClassNames={{ event: "day-has-event" }}
            footer={
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(`${selectedDate}T00:00:00`), "PPP")}
                </p>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("calendar.noEvents")}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 p-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="size-4 text-amber-500" />
                        {t("calendar.deleteAllForDate")}
                      </div>
                      <Button size="sm" variant="destructive" onClick={handleClearSelectedDate}>
                        {t("calendar.clearDay")}
                      </Button>
                    </div>
                    {selectedDayEvents.map((event) => (
                      <div key={event.id} className="rounded-md border border-border bg-card p-2">
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        {event.description ? (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {event.owner ? <span>{t("calendar.ownerPrefix")}: {event.owner}</span> : null}
                          {event.location ? <span>{t("calendar.locationPrefix")}: {event.location}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      <TeamEventForm onCreateEvent={handleCreateEvent} selectedDate={selectedDate} />
    </div>
  );
};
