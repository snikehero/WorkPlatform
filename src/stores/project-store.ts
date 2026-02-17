import type { Project } from "@/types/project";
import { createId } from "@/lib/id";

const PROJECTS_KEY = "workplatform-projects";

const loadProjects = (): Project[] => {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
};

let projects: Project[] = loadProjects();

const saveProjects = () => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

export const projectStore = {
  all: () => projects,
  add: (name: string, description: string) => {
    const project: Project = {
      id: createId(),
      name,
      description,
      createdAt: new Date().toISOString(),
    };

    projects = [project, ...projects];
    saveProjects();
    return project;
  },
  remove: (projectId: string) => {
    projects = projects.filter((project) => project.id !== projectId);
    saveProjects();
  },
};
