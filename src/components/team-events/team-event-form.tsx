import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/i18n";

type TeamEventFormProps = {
  onCreateEvent: (
    title: string,
    eventDate: string,
    description: string,
    owner: string,
    location: string
  ) => void;
  selectedDate: string;
};

export const TeamEventForm = ({ onCreateEvent, selectedDate }: TeamEventFormProps) => {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onCreateEvent(
      title.trim(),
      selectedDate,
      description.trim(),
      owner.trim(),
      location.trim()
    );
    setTitle("");
    setDescription("");
    setOwner("");
    setLocation("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("calendar.formTitle")}</CardTitle>
        <CardDescription>{t("calendar.formSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="team-event-title">{t("common.title")}</Label>
            <Input
              id="team-event-title"
              placeholder={t("calendar.titlePlaceholder")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-event-description">{t("common.description")}</Label>
            <Textarea
              id="team-event-description"
              placeholder={t("calendar.descriptionPlaceholder")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team-event-owner">{t("common.owner")}</Label>
              <Input
                id="team-event-owner"
                placeholder={t("calendar.ownerPlaceholder")}
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-event-location">{t("common.location")}</Label>
              <Input
                id="team-event-location"
                placeholder={t("calendar.locationPlaceholder")}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </div>
          <Button type="submit">{t("calendar.addEvent")}</Button>
        </form>
      </CardContent>
    </Card>
  );
};
