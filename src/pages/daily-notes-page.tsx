import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { NoteForm } from "@/components/notes/note-form";
import { NoteList } from "@/components/notes/note-list";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseObsidianDailyMarkdown } from "@/lib/obsidian-daily-parser";
import { noteStore } from "@/stores/note-store";
import { format } from "date-fns";

export const DailyNotesPage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [version, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleImportFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const existingNotes = noteStore.all();
    let imported = 0;
    let skipped = 0;

    for (const file of files) {
      const markdown = await file.text();
      const parsed = parseObsidianDailyMarkdown(file.name, markdown);
      const duplicate = existingNotes.some(
        (note) =>
          note.noteDate === parsed.noteDate &&
          note.title === parsed.title &&
          note.content === parsed.content
      );

      if (duplicate) {
        skipped += 1;
        continue;
      }

      const created = noteStore.add(parsed.title, parsed.content, parsed.noteDate);
      existingNotes.unshift(created);
      imported += 1;
    }

    setImportMessage(`Imported ${imported} file(s). Skipped ${skipped} duplicate(s).`);
    refresh();
    event.target.value = "";
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Notes</h1>
        <p className="text-sm text-muted-foreground">
          prueba a lightweight log of decisions, blockers, and updates.
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
                      setSelectedDate(format(date, "yyyy-MM-dd"));
                    }}
                    initialFocus
                    classNames={calendarClassNames}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="secondary" onClick={() => setSelectedDate(today)}>
              Today
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              multiple
              className="hidden"
              onChange={handleImportFiles}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Obsidian .md
            </Button>
          </div>
          {importMessage ? <p className="mt-3 text-sm text-muted-foreground">{importMessage}</p> : null}
        </CardContent>
      </Card>
      <NoteForm onCreateNote={handleCreateNote} selectedDate={selectedDate} />
      <NoteList notes={filteredNotes} onDeleteNote={handleDeleteNote} />
    </div>
  );
};
