import type { Project } from "@/types/project";
import type { Task, TaskStatus } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TaskBoardProps = {
  tasks: Task[];
  projects: Project[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
};

const columns: Array<{ key: TaskStatus; title: string }> = [
  { key: "todo", title: "To do" },
  { key: "in-progress", title: "In progress" },
  { key: "done", title: "Done" },
];

export const TaskBoard = ({ tasks, projects, onUpdateStatus, onDeleteTask }: TaskBoardProps) => {
  const projectMap = new Map(projects.map((project) => [project.id, project]));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key);
        return (
          <div key={column.key} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">{column.title}</div>
              <Badge variant="neutral">{columnTasks.length}</Badge>
            </div>
            {columnTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks</p>
            ) : (
              <ul className="space-y-3">
                {columnTasks.map((task) => (
                  <li key={task.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      {task.details ? (
                        <p className="text-xs text-muted-foreground">{task.details}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {task.projectId ? (
                          <Badge variant="neutral">
                            {projectMap.get(task.projectId)?.name ?? "Project"}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdateStatus(task.id, "todo")}
                        >
                          To do
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdateStatus(task.id, "in-progress")}
                        >
                          In progress
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdateStatus(task.id, "done")}
                        >
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};
