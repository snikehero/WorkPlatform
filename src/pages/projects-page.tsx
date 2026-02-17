import { useMemo, useState } from "react";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectList } from "@/components/projects/project-list";
import { projectStore } from "@/stores/project-store";
import { taskStore } from "@/stores/task-store";

export const ProjectsPage = () => {
  const [version, setVersion] = useState(0);
  const projects = useMemo(() => projectStore.all(), [version]);
  const tasks = useMemo(() => taskStore.all(), [version]);

  const refresh = () => setVersion((current) => current + 1);

  const handleCreateProject = (name: string, description: string) => {
    projectStore.add(name, description);
    refresh();
  };

  const handleDeleteProject = (projectId: string) => {
    projectStore.remove(projectId);
    refresh();
  };

  const getTaskCount = (projectId: string) =>
    tasks.filter((task) => task.projectId === projectId).length;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Group related tasks and keep your work organized.
        </p>
      </section>
      <ProjectForm onCreateProject={handleCreateProject} />
      <ProjectList
        projects={projects}
        getTaskCount={getTaskCount}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  );
};
