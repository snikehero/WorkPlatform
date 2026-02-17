import { useEffect, useMemo, useState } from "react";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectList } from "@/components/projects/project-list";
import { projectStore } from "@/stores/project-store";
import { taskStore } from "@/stores/task-store";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { useI18n } from "@/i18n/i18n";

export const ProjectsPage = () => {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadData = async () => {
    const [nextProjects, nextTasks] = await Promise.all([projectStore.all(), taskStore.all()]);
    setProjects(nextProjects);
    setTasks(nextTasks);
  };

  useEffect(() => {
    loadData().catch(() => {
      setProjects([]);
      setTasks([]);
    });
  }, []);

  const handleCreateProject = async (name: string, description: string) => {
    await projectStore.add(name, description);
    await loadData();
  };

  const handleDeleteProject = async (projectId: string) => {
    await projectStore.remove(projectId);
    await loadData();
  };

  const getTaskCount = useMemo(
    () => (projectId: string) => tasks.filter((task) => task.projectId === projectId).length,
    [tasks]
  );

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("projects.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("projects.pageSubtitle")}
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
