import type { Task, TaskStatus } from "@/types/task";

const TASKS_KEY = "workplatform-daily-tasks";

const loadTasks = (): Task[] => {
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Task[];
    return parsed;
  } catch {
    return [];
  }
};

let tasks: Task[] = loadTasks();

const saveTasks = () => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const taskStore = {
  all: () => tasks,
  add: (title: string, details: string) => {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      details,
      status: "todo",
      createdAt: new Date().toISOString(),
    };

    tasks = [task, ...tasks];
    saveTasks();
    return task;
  },
  updateStatus: (taskId: string, status: TaskStatus) => {
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task
    );
    saveTasks();
  },
  remove: (taskId: string) => {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
  },
};
