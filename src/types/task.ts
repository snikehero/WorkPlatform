export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: string;
  title: string;
  details: string;
  completionSummary: string;
  documentation: string;
  additionalNotes: string;
  status: TaskStatus;
  projectId: string | null;
  taskDate: string;
  createdAt: string;
};
