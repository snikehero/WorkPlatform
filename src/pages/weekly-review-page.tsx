import { useMemo, useState } from "react";
import { addWeeks, format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { taskStore } from "@/stores/task-store";
import { noteStore } from "@/stores/note-store";
import { projectStore } from "@/stores/project-store";

export const WeeklyReviewPage = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const start = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const end = addWeeks(start, 1);

  const tasks = useMemo(() => taskStore.all(), []);
  const notes = useMemo(() => noteStore.all(), []);
  const projects = useMemo(() => projectStore.all(), []);

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Weekly Review</h1>
        <p className="text-sm text-muted-foreground">
          A quick snapshot of your work for the week.
        </p>
      </section>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setWeekOffset((value) => value - 1)}>
              Previous
            </Button>
            <Button variant="secondary" onClick={() => setWeekOffset(0)}>
              Current week
            </Button>
            <Button variant="secondary" onClick={() => setWeekOffset((value) => value + 1)}>
              Next
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
            <CardTitle>Completed</CardTitle>
            <CardDescription>{completed.length} task(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {completed.length === 0 ? (
                <li>No completed tasks.</li>
              ) : (
                completed.map((task) => <li key={task.id}>- {task.title}</li>)
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
            <CardDescription>{inProgress.length} task(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {inProgress.length === 0 ? (
                <li>No tasks in progress.</li>
              ) : (
                inProgress.map((task) => <li key={task.id}>- {task.title}</li>)
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open</CardTitle>
            <CardDescription>{open.length} task(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {open.length === 0 ? (
                <li>No open tasks.</li>
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
            <CardTitle>Notes</CardTitle>
            <CardDescription>{weekNotes.length} note(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {weekNotes.length === 0 ? (
                <li>No notes logged.</li>
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
            <CardTitle>Projects</CardTitle>
            <CardDescription>Task counts this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tasksByProject.length === 0 ? (
                <li>No projects created.</li>
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
