import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
};

export const TaskList = ({ tasks, onUpdateStatus, onDeleteTask }: TaskListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Tasks</CardTitle>
        <CardDescription>Track progress during your workday.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks yet. Add your first task above.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.details ? <p className="text-sm text-slate-600">{task.details}</p> : null}
                    <Badge variant={statusVariantMap[task.status]}>{statusLabelMap[task.status]}</Badge>
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
