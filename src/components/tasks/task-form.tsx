import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/types/project";

type TaskFormProps = {
  onCreateTask: (
    title: string,
    details: string,
    projectId: string | null,
    taskDate: string
  ) => void;
  selectedDate: string;
  projects: Project[];
};

export const TaskForm = ({ onCreateTask, projects, selectedDate }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [projectId, setProjectId] = useState<string>("none");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    const selectedProjectId = projectId === "none" ? null : projectId;
    onCreateTask(title.trim(), details.trim(), selectedProjectId, selectedDate);
    setTitle("");
    setDetails("");
    setProjectId("none");
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
          <div className="space-y-2">
            <Label htmlFor="task-project">Project</Label>
            <Select
              id="task-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="none">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Add task</Button>
        </form>
      </CardContent>
    </Card>
  );
};
