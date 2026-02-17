import { useMemo, useState } from "react";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { taskStore } from "@/stores/task-store";
import type { TaskStatus } from "@/types/task";

export const DailyTasksPage = () => {
  const [version, setVersion] = useState(0);
  const tasks = useMemo(() => taskStore.all(), [version]);

  const refresh = () => setVersion((current) => current + 1);

  const handleCreateTask = (title: string, details: string) => {
    taskStore.add(title, details);
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

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Daily Work Tasks
        </h1>
        <p className="text-sm text-slate-600">
          PRUEBA, update, and complete your tasks every day.
        </p>
      </section>
      <TaskForm onCreateTask={handleCreateTask} />
      <TaskList
        tasks={tasks}
        onUpdateStatus={handleUpdateStatus}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};
