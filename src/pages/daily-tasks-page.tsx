import { useEffect, useMemo, useState } from "react";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { projectStore } from "@/stores/project-store";
import { taskStore } from "@/stores/task-store";
import type { Project } from "@/types/project";
import type { Task, TaskStatus } from "@/types/task";
import { format } from "date-fns";
import { Copy } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

export const DailyTasksPage = () => {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCompleted, setShowCompleted] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadData = async () => {
    const [nextTasks, nextProjects] = await Promise.all([taskStore.all(), projectStore.all()]);
    setTasks(nextTasks);
    setProjects(nextProjects);
  };

  useEffect(() => {
    loadData().catch(() => {
      setTasks([]);
      setProjects([]);
    });
  }, []);

  const dateTasks = useMemo(
    () => tasks.filter((task) => task.taskDate === selectedDate),
    [tasks, selectedDate],
  );
  const filteredTasks = useMemo(
    () =>
      dateTasks.filter((task) => {
        if (statusFilter !== "all" && task.status !== statusFilter) return false;
        if (projectFilter !== "all" && task.projectId !== projectFilter) return false;
        return true;
      }),
    [dateTasks, statusFilter, projectFilter],
  );

  const handleCreateTask = async (
    title: string,
    details: string,
    projectId: string | null,
    taskDate: string,
  ) => {
    await taskStore.add(title, details, projectId, taskDate);
    await loadData();
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    await taskStore.updateStatus(taskId, status);
    await loadData();
  };

  const handleDeleteTask = async (taskId: string) => {
    await taskStore.remove(taskId);
    await loadData();
  };

  const summary = useMemo(() => {
    const completed = dateTasks.filter((task) => task.status === "done");
    const inProgress = dateTasks.filter((task) => task.status === "in-progress");
    const open = dateTasks.filter((task) => task.status === "todo");

    const summaryLines = [
      `${t("tasks.summaryHeading")} - ${format(new Date(selectedDate), "PPP")}`,
      "",
      `${t("tasks.completedHeading")} (${completed.length}):`,
      ...completed.map((task) => `- ${task.title}`),
      "",
      `${t("tasks.inProgressHeading")} (${inProgress.length}):`,
      ...inProgress.map((task) => `- ${task.title}`),
      "",
      `${t("tasks.openHeading")} (${open.length}):`,
      ...open.map((task) => `- ${task.title}`),
    ];

    return summaryLines.join("\n");
  }, [dateTasks, selectedDate]);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = summary;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("tasks.pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("tasks.pageSubtitle")}
        </p>
      </section>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="tasks-date"
              >
                {t("tasks.taskDate")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    className="min-w-[220px] justify-start"
                  >
                    {format(new Date(selectedDate), "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    className="rounded-lg border"
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={(date) => {
                      if (!date) return;
                      setSelectedDate(format(date, "yyyy-MM-dd"));
                    }}
                    classNames={calendarClassNames}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="secondary" onClick={() => setSelectedDate(today)}>
              {t("common.today")}
            </Button>
            <Button variant="ghost" onClick={() => setShowCompleted((value) => !value)}>
              {showCompleted ? t("tasks.hideCompleted") : t("tasks.showCompleted")}
            </Button>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="status-filter">
                {t("common.status")}
              </label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as TaskStatus | "all")
                }
              >
                <option value="all">{t("tasks.all")}</option>
                <option value="todo">{t("tasks.todo")}</option>
                <option value="in-progress">{t("tasks.inProgress")}</option>
                <option value="done">{t("tasks.done")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="project-filter">
                {t("common.project")}
              </label>
              <Select
                id="project-filter"
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
              >
                <option value="all">{t("tasks.allProjects")}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("common.view")}</label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  {t("common.list")}
                </Button>
                <Button
                  variant={viewMode === "board" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setViewMode("board")}
                >
                  {t("common.board")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <TaskForm
        onCreateTask={handleCreateTask}
        projects={projects}
        selectedDate={selectedDate}
      />
      {viewMode === "list" ? (
        <TaskList
          tasks={filteredTasks}
          projects={projects}
          showCompleted={showCompleted}
          onUpdateStatus={handleUpdateStatus}
          onDeleteTask={handleDeleteTask}
        />
      ) : (
        <TaskBoard
          tasks={
            showCompleted
              ? filteredTasks
              : filteredTasks.filter((task) => task.status !== "done")
          }
          projects={projects}
          onUpdateStatus={handleUpdateStatus}
          onDeleteTask={handleDeleteTask}
        />
      )}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t("tasks.summaryTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("tasks.summarySubtitle")}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCopySummary}>
              <Copy className="mr-1 size-4" />
              {t("common.copy")}
            </Button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm text-foreground">
            {summary}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
