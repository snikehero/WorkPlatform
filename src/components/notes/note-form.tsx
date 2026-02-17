import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type NoteFormProps = {
  onCreateNote: (title: string, content: string, noteDate: string) => void;
  selectedDate: string;
};

export const NoteForm = ({ onCreateNote, selectedDate }: NoteFormProps) => {
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
        <CardTitle>Daily Note</CardTitle>
        <CardDescription>Capture decisions, blockers, and quick wins.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              placeholder="Standup summary"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-content">Details</Label>
            <Textarea
              id="note-content"
              placeholder="What happened today? What needs follow-up?"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>
          <Button type="submit">Add note</Button>
        </form>
      </CardContent>
    </Card>
  );
};
