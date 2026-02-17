import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/types/project";

type ProjectListProps = {
  projects: Project[];
  getTaskCount: (projectId: string) => number;
  onDeleteProject: (projectId: string) => void;
};

export const ProjectList = ({
  projects,
  getTaskCount,
  onDeleteProject,
}: ProjectListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Group tasks and keep focus aligned.</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No projects yet. Add your first project above.
          </p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{project.name}</p>
                    {project.description ? (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground/70">
                      {getTaskCount(project.id)} task(s)
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => onDeleteProject(project.id)}>
                    Delete
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
