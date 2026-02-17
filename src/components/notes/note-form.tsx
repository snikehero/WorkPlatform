import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/i18n";

type NoteFormProps = {
  onCreateNote: (title: string, content: string, noteDate: string) => void;
  selectedDate: string;
};

export const NoteForm = ({ onCreateNote, selectedDate }: NoteFormProps) => {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onCreateNote(title.trim(), content.trim(), selectedDate);
    setTitle("");
    setContent("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notes.formTitle")}</CardTitle>
        <CardDescription>{t("notes.formSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="note-title">{t("common.title")}</Label>
            <Input
              id="note-title"
              placeholder={t("notes.titlePlaceholder")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-content">{t("common.details")}</Label>
            <Textarea
              id="note-content"
              placeholder={t("notes.detailsPlaceholder")}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>
          <Button type="submit">{t("notes.addNote")}</Button>
        </form>
      </CardContent>
    </Card>
  );
};
