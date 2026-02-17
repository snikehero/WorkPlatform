import { useMemo, useState } from "react";
import { NoteForm } from "@/components/notes/note-form";
import { NoteList } from "@/components/notes/note-list";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { noteStore } from "@/stores/note-store";
import { format } from "date-fns";

export const DailyNotesPage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [version, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const notes = useMemo(() => noteStore.all(), [version]);
  const filteredNotes = useMemo(
    () => notes.filter((note) => note.noteDate === selectedDate),
    [notes, selectedDate]
  );

  const refresh = () => setVersion((current) => current + 1);

  const handleCreateNote = (title: string, content: string, noteDate: string) => {
    noteStore.add(title, content, noteDate);
    refresh();
  };

  const handleDeleteNote = (noteId: string) => {
    noteStore.remove(noteId);
    refresh();
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Notes</h1>
        <p className="text-sm text-muted-foreground">
          Keep a lightweight log of decisions, blockers, and updates.
        </p>
      </section>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="notes-date">
                Note date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" className="min-w-[220px] justify-start">
                    {format(new Date(selectedDate), "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={(date) => {
                      if (!date) return;
                      setSelectedDate(date.toISOString().slice(0, 10));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="secondary" onClick={() => setSelectedDate(today)}>
              Today
            </Button>
          </div>
        </CardContent>
      </Card>
      <NoteForm onCreateNote={handleCreateNote} selectedDate={selectedDate} />
      <NoteList notes={filteredNotes} onDeleteNote={handleDeleteNote} />
    </div>
  );
};
