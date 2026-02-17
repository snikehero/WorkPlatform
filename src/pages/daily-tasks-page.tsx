import { useMemo, useState } from "react";
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
import type { TaskStatus } from "@/types/task";
import { format } from "date-fns";
import { Copy } from "lucide-react";

export const DailyTasksPage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [version, setVersion] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCompleted, setShowCompleted] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const tasks = useMemo(() => taskStore.all(), [version]);
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
  const projects = useMemo(() => projectStore.all(), [version]);

  const refresh = () => setVersion((current) => current + 1);

  const handleCreateTask = (
    title: string,
    details: string,
    projectId: string | null,
    taskDate: string,
  ) => {
    taskStore.add(title, details, projectId, taskDate);
    refresh();
  };

  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    taskStore.updateStatus(taskId, status);
    refresh();
  };

  const handleDeleteTask = (taskId: string) => {
    taskStore.remove(taskId);
    refresh();
  };

  const summary = useMemo(() => {
    const completed = dateTasks.filter((task) => task.status === "done");
    const inProgress = dateTasks.filter((task) => task.status === "in-progress");
    const open = dateTasks.filter((task) => task.status === "todo");

    const summaryLines = [
      `Daily Summary - ${format(new Date(selectedDate), "PPP")}`,
      "",
      `Completed (${completed.length}):`,
      ...completed.map((task) => `- ${task.title}`),
      "",
      `In Progress (${inProgress.length}):`,
      ...inProgress.map((task) => `- ${task.title}`),
      "",
      `Open (${open.length}):`,
      ...open.map((task) => `- ${task.title}`),
    ];

    return summaryLines.join("\n");
  }, [dateTasks, selectedDate]);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // Fallback for older browsers
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

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Daily Work Tasks
        </h1>
        <p className="text-sm text-muted-foreground">
          Log, update, and complete your tasks every day.
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
                Task date
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
                      setSelectedDate(date.toISOString().slice(0, 10));
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="secondary" onClick={() => setSelectedDate(today)}>
              Today
            </Button>
            <Button variant="ghost" onClick={() => setShowCompleted((value) => !value)}>
              {showCompleted ? "Hide completed" : "Show completed"}
            </Button>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="status-filter">
                Status
              </label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as TaskStatus | "all")
                }
              >
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="project-filter">
                Project
              </label>
              <Select
                id="project-filter"
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
              >
                <option value="all">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">View</label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === "board" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setViewMode("board")}
                >
                  Board
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
              <p className="text-sm font-medium text-foreground">Daily Summary</p>
              <p className="text-xs text-muted-foreground">
                Copy this into standup or status updates.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCopySummary}>
              <Copy className="mr-1 size-4" />
              Copy
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


