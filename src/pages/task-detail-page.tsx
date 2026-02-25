import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { taskStore } from "@/stores/task-store";
import type { Task } from "@/types/task";

export const TaskDetailPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const shouldComplete = searchParams.get("complete") === "1";

  const [task, setTask] = useState<Task | null>(null);
  const [completionSummary, setCompletionSummary] = useState("");
  const [documentation, setDocumentation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isDone = task?.status === "done";

  const loadTask = async () => {
    if (!taskId) {
      setTask(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await taskStore.one(taskId);
      setTask(data);
      setCompletionSummary(data.completionSummary ?? "");
      setDocumentation(data.documentation ?? "");
      setAdditionalNotes(data.additionalNotes ?? "");
    } catch {
      setTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadTask().catch(() => {
      setTask(null);
      setIsLoading(false);
    });
  }, [taskId]);

  const pageSubtitle = useMemo(() => {
    if (shouldComplete && !isDone) return t("tasks.taskDetailCompleteHint");
    return t("tasks.taskDetailPageSubtitle");
  }, [isDone, shouldComplete, t]);

  const saveDetails = async () => {
    if (!taskId) throw new Error("Task not found");
    const trimmedSummary = completionSummary.trim();
    const trimmedDocumentation = documentation.trim();
    const trimmedAdditionalNotes = additionalNotes.trim();
    const updated = await taskStore.updateDetail(taskId, trimmedSummary, trimmedDocumentation, trimmedAdditionalNotes);
    setTask(updated);
    setCompletionSummary(updated.completionSummary);
    setDocumentation(updated.documentation);
    setAdditionalNotes(updated.additionalNotes);
    return updated;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await saveDetails();
      showToast(t("tasks.taskDetailSaved"), "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tasks.taskDetailLoadError");
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task || !taskId) return;
    if (!completionSummary.trim()) {
      showToast(t("tasks.taskDetailSummaryRequired"), "error");
      return;
    }
    setIsSaving(true);
    try {
      await saveDetails();
      await taskStore.updateStatus(taskId, "done");
      const refreshed = await taskStore.one(taskId);
      setTask(refreshed);
      setCompletionSummary(refreshed.completionSummary);
      setDocumentation(refreshed.documentation);
      setAdditionalNotes(refreshed.additionalNotes);
      showToast(t("tasks.taskDetailCompleted"), "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tasks.taskDetailLoadError");
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tasks.taskDetailPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("tasks.taskDetailPageSubtitle")}</p>
        </section>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("tasks.taskDetailLoading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tasks.taskDetailPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("tasks.taskDetailPageSubtitle")}</p>
        </section>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("tasks.taskDetailTaskNotFound")}</p>
            <Button className="mt-4" variant="secondary" onClick={() => navigate("/tasks")}>
              {t("tasks.taskDetailBackButton")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tasks.taskDetailPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>{task.title}</span>
            <Badge variant={isDone ? "success" : task.status === "in-progress" ? "info" : "warning"}>
              {task.status === "done" ? t("tasks.done") : task.status === "in-progress" ? t("tasks.inProgress") : t("tasks.todo")}
            </Badge>
          </CardTitle>
          <CardDescription>{t("tasks.taskDetailTaskDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{task.details || t("tasks.detailsPlaceholder")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tasks.taskDetailPageTitle")}</CardTitle>
          <CardDescription>{t("tasks.taskDetailFormSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-2">
              <Label htmlFor="task-detail-summary">{t("tasks.taskDetailSummary")}</Label>
              <Input
                id="task-detail-summary"
                value={completionSummary}
                onChange={(event) => setCompletionSummary(event.target.value)}
                placeholder={t("tasks.taskDetailSummaryPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-detail-documentation">{t("tasks.taskDetailDocumentation")}</Label>
              <Textarea
                id="task-detail-documentation"
                value={documentation}
                onChange={(event) => setDocumentation(event.target.value)}
                placeholder={t("tasks.taskDetailDocumentationPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-detail-additional-notes">{t("tasks.taskDetailAdditionalNotes")}</Label>
              <Textarea
                id="task-detail-additional-notes"
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
                placeholder={t("tasks.taskDetailAdditionalNotesPlaceholder")}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving}>
                {t("tasks.taskDetailSaveButton")}
              </Button>
              <Button type="button" variant="secondary" disabled={isSaving || isDone} onClick={handleCompleteTask}>
                {t("tasks.taskDetailCompleteButton")}
              </Button>
              <Button type="button" variant="ghost" disabled={isSaving} onClick={() => navigate("/tasks")}>
                {t("tasks.taskDetailBackButton")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
