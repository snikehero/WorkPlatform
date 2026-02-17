import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Note } from "@/types/note";
import { useI18n } from "@/i18n/i18n";

type NoteListProps = {
  notes: Note[];
  onDeleteNote: (noteId: string) => void;
};

export const NoteList = ({ notes, onDeleteNote }: NoteListProps) => {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notes.listTitle")}</CardTitle>
        <CardDescription>{t("notes.listSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("notes.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{note.title}</p>
                    {note.content ? (
                      <p className="text-sm text-muted-foreground">{note.content}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => onDeleteNote(note.id)}>
                    {t("common.delete")}
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
