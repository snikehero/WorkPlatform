import { apiRequest } from "@/lib/api";
import type { Note } from "@/types/note";

export const noteStore = {
  all: () => apiRequest<Note[]>("/api/notes"),
  add: (title: string, content: string, noteDate: string) =>
    apiRequest<Note>("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title, content, noteDate }),
    }),
  remove: (noteId: string) =>
    apiRequest<{ ok: boolean }>(`/api/notes/${noteId}`, { method: "DELETE" }),
};
