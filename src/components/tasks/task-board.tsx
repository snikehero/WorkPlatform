import React from "react";
import type { Project } from "@/types/project";
import type { Task, TaskStatus } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

type BoardTaskCardProps = {
  task: Task;
  projectName?: string;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
};

const BoardTaskCard = ({ task, projectName, onUpdateStatus, onDeleteTask }: BoardTaskCardProps) => (
  <div className="rounded-lg border border-border bg-background p-3">
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{task.title}</p>
      {task.details ? <p className="text-xs text-muted-foreground">{task.details}</p> : null}
      <div className="flex flex-wrap gap-2">
        {projectName ? <Badge variant="neutral">{projectName}</Badge> : null}
      </div>
      <div className="flex flex-wrap gap-2">
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
        <Button size="sm" variant="destructive" onClick={() => onDeleteTask(task.id)}>
          Delete
        </Button>
      </div>
    </div>
  </div>
);

const SortableTaskCard = ({ task, projectName, onUpdateStatus, onDeleteTask }: BoardTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : undefined}
      {...attributes}
      {...listeners}
    >
      <BoardTaskCard
        task={task}
        projectName={projectName}
        onUpdateStatus={onUpdateStatus}
        onDeleteTask={onDeleteTask}
      />
    </div>
  );
};

const BoardColumn = ({
  columnKey,
  title,
  tasks,
  projectMap,
  onUpdateStatus,
  onDeleteTask,
}: {
  columnKey: TaskStatus;
  title: string;
  tasks: Task[];
  projectMap: Map<string, Project>;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}) => {
  const { setNodeRef } = useDroppable({ id: columnKey });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <Badge variant="neutral">{tasks.length}</Badge>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                projectName={task.projectId ? projectMap.get(task.projectId)?.name : undefined}
                onUpdateStatus={onUpdateStatus}
                onDeleteTask={onDeleteTask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export const TaskBoard = ({ tasks, projects, onUpdateStatus, onDeleteTask }: TaskBoardProps) => {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);

    const taskId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    const task = tasks.find((item) => item.id === taskId);
    const targetColumn = columns.find((column) => column.key === overId);
    if (!task || !targetColumn) return;

    const columnKey = targetColumn.key;
    if (task.status !== columnKey) {
      onUpdateStatus(taskId, columnKey);
    }
  };

  const activeTask = tasks.find((task) => task.id === activeTaskId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          return (
            <BoardColumn
              key={column.key}
              columnKey={column.key}
              title={column.title}
              tasks={columnTasks}
              projectMap={projectMap}
              onUpdateStatus={onUpdateStatus}
              onDeleteTask={onDeleteTask}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <BoardTaskCard
            task={activeTask}
            projectName={activeTask.projectId ? projectMap.get(activeTask.projectId)?.name : undefined}
            onUpdateStatus={onUpdateStatus}
            onDeleteTask={onDeleteTask}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
