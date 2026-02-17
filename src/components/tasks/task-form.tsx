import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TaskFormProps = {
  onCreateTask: (title: string, details: string) => void;
};

export const TaskForm = ({ onCreateTask }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onCreateTask(title.trim(), details.trim());
    setTitle("");
    setDetails("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Daily Task</CardTitle>
        <CardDescription>Capture what you need to do today.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">Task title</Label>
            <Input
              id="task-title"
              placeholder="Prepare sprint report"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-details">Details</Label>
            <Textarea
              id="task-details"
              placeholder="Add context, blockers, and notes..."
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </div>
          <Button type="submit">Add task</Button>
        </form>
      </CardContent>
    </Card>
  );
};
