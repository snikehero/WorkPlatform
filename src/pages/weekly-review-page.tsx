import { useEffect, useMemo, useState } from "react";
import { addWeeks, format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { taskStore } from "@/stores/task-store";
import { noteStore } from "@/stores/note-store";
import { projectStore } from "@/stores/project-store";
import type { Task } from "@/types/task";
import type { Note } from "@/types/note";
import type { Project } from "@/types/project";
import { useI18n } from "@/i18n/i18n";

export const WeeklyReviewPage = () => {
  const { t } = useI18n();
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const start = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const end = addWeeks(start, 1);

  useEffect(() => {
    Promise.all([taskStore.all(), noteStore.all(), projectStore.all()])
      .then(([nextTasks, nextNotes, nextProjects]) => {
        setTasks(nextTasks);
        setNotes(nextNotes);
        setProjects(nextProjects);
      })
      .catch(() => {
        setTasks([]);
        setNotes([]);
        setProjects([]);
      });
  }, []);

  const weekTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const date = new Date(task.taskDate);
        return date >= start && date < end;
      }),
    [tasks, start, end]
  );

  const weekNotes = useMemo(
    () =>
      notes.filter((note) => {
        const date = new Date(note.noteDate);
        return date >= start && date < end;
      }),
    [notes, start, end]
  );

  const completed = weekTasks.filter((task) => task.status === "done");
  const inProgress = weekTasks.filter((task) => task.status === "in-progress");
  const open = weekTasks.filter((task) => task.status === "todo");

  const tasksByProject = projects.map((project) => ({
    id: project.id,
    name: project.name,
    count: weekTasks.filter((task) => task.projectId === project.id).length,
  }));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("weekly.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("weekly.pageSubtitle")}
        </p>
      </section>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setWeekOffset((value) => value - 1)}>
              {t("weekly.previous")}
            </Button>
            <Button variant="secondary" onClick={() => setWeekOffset(0)}>
              {t("weekly.currentWeek")}
            </Button>
            <Button variant="secondary" onClick={() => setWeekOffset((value) => value + 1)}>
              {t("weekly.next")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {format(start, "MMM d")} - {format(addWeeks(start, 1), "MMM d")}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("tasks.completedHeading")}</CardTitle>
            <CardDescription>{completed.length} {t("common.taskCount")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {completed.length === 0 ? (
                <li>{t("weekly.completedEmpty")}</li>
              ) : (
                completed.map((task) => <li key={task.id}>- {task.title}</li>)
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("tasks.inProgressHeading")}</CardTitle>
            <CardDescription>{inProgress.length} {t("common.taskCount")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {inProgress.length === 0 ? (
                <li>{t("weekly.inProgressEmpty")}</li>
              ) : (
                inProgress.map((task) => <li key={task.id}>- {task.title}</li>)
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("tasks.openHeading")}</CardTitle>
            <CardDescription>{open.length} {t("common.taskCount")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {open.length === 0 ? (
                <li>{t("weekly.openEmpty")}</li>
              ) : (
                open.map((task) => <li key={task.id}>- {task.title}</li>)
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("nav.notes")}</CardTitle>
            <CardDescription>{weekNotes.length} {t("common.noteCount")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {weekNotes.length === 0 ? (
                <li>{t("weekly.notesEmpty")}</li>
              ) : (
                weekNotes.map((note) => (
                  <li key={note.id}>
                    - {note.title} ({format(new Date(note.noteDate), "MMM d")})
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("nav.projects")}</CardTitle>
            <CardDescription>{t("weekly.projectsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tasksByProject.length === 0 ? (
                <li>{t("weekly.projectsEmpty")}</li>
              ) : (
                tasksByProject.map((project) => (
                  <li key={project.id}>
                    - {project.name}: {project.count}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
