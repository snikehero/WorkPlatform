export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: string;
  title: string;
  details: string;
  status: TaskStatus;
  createdAt: string;
};
