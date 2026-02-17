import type { Note } from "@/types/note";

const NOTES_KEY = "workplatform-daily-notes";

const loadNotes = (): Note[] => {
  const raw = localStorage.getItem(NOTES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Note[];
    return parsed.map((note) => ({
      ...note,
      noteDate: note.noteDate ?? note.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
};

let notes: Note[] = loadNotes();

const saveNotes = () => {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const noteStore = {
  all: () => notes,
  add: (title: string, content: string, noteDate: string) => {
    const note: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      noteDate,
      createdAt: new Date().toISOString(),
    };

    notes = [note, ...notes];
    saveNotes();
    return note;
  },
  remove: (noteId: string) => {
    notes = notes.filter((note) => note.id !== noteId);
    saveNotes();
  },
};
