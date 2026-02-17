import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/types/project";
import type { Task, TaskStatus } from "@/types/task";

const statusLabelMap: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

const statusVariantMap: Record<TaskStatus, "warning" | "info" | "success"> = {
  todo: "warning",
  "in-progress": "info",
  done: "success",
};

type TaskListProps = {
  tasks: Task[];
  projects: Project[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  showCompleted: boolean;
};

export const TaskList = ({
  tasks,
  projects,
  onUpdateStatus,
  onDeleteTask,
  showCompleted,
}: TaskListProps) => {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const filteredTasks = showCompleted ? tasks : tasks.filter((task) => task.status !== "done");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Tasks</CardTitle>
        <CardDescription>Track progress during your workday.</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet. Add your first task above.</p>
        ) : (
          <ul className="space-y-3">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{task.title}</p>
                    {task.details ? (
                      <p className="text-sm text-muted-foreground">{task.details}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusVariantMap[task.status]}>
                        {statusLabelMap[task.status]}
                      </Badge>
                      {task.projectId ? (
                        <Badge variant="neutral">
                          {projectMap.get(task.projectId)?.name ?? "Project"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => onDeleteTask(task.id)}>
                    Delete
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(task.id, "todo")}>
                    To do
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onUpdateStatus(task.id, "in-progress")}
                  >
                    In progress
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(task.id, "done")}>
                    Done
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
