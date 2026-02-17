import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/types/project";
import { useI18n } from "@/i18n/i18n";

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
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("projects.pageTitle")}</CardTitle>
        <CardDescription>{t("projects.listSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("projects.empty")}
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
                      {getTaskCount(project.id)} {t("projects.taskCount")}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => onDeleteProject(project.id)}>
                    {t("common.delete")}
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
