import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/types/project";
import { useI18n } from "@/i18n/i18n";

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
  const { t } = useI18n();
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
        <CardTitle>{t("tasks.logTitle")}</CardTitle>
        <CardDescription>{t("tasks.logSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">{t("tasks.taskTitle")}</Label>
            <Input
              id="task-title"
              placeholder={t("tasks.taskTitlePlaceholder")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-details">{t("common.details")}</Label>
            <Textarea
              id="task-details"
              placeholder={t("tasks.detailsPlaceholder")}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-project">{t("common.project")}</Label>
            <Select
              id="task-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="none">{t("tasks.noProject")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">{t("tasks.addTask")}</Button>
        </form>
      </CardContent>
    </Card>
  );
};
