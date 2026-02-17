import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/i18n";

type ProjectFormProps = {
  onCreateProject: (name: string, description: string) => void;
};

export const ProjectForm = ({ onCreateProject }: ProjectFormProps) => {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onCreateProject(name.trim(), description.trim());
    setName("");
    setDescription("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("projects.formTitle")}</CardTitle>
        <CardDescription>{t("projects.formSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="project-name">{t("projects.name")}</Label>
            <Input
              id="project-name"
              placeholder={t("projects.namePlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">{t("common.description")}</Label>
            <Textarea
              id="project-description"
              placeholder={t("projects.descriptionPlaceholder")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button type="submit">{t("projects.addProject")}</Button>
        </form>
      </CardContent>
    </Card>
  );
};
