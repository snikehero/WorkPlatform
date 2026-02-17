import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        <CardTitle>Team Event</CardTitle>
        <CardDescription>Add an upcoming team item to the calendar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="team-event-title">Title</Label>
            <Input
              id="team-event-title"
              placeholder="Sprint planning"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-event-description">Description</Label>
            <Textarea
              id="team-event-description"
              placeholder="Agenda, links, or goals..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team-event-owner">Owner</Label>
              <Input
                id="team-event-owner"
                placeholder="Alex"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-event-location">Location</Label>
              <Input
                id="team-event-location"
                placeholder="Zoom / Room 3A"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </div>
          <Button type="submit">Add event</Button>
        </form>
      </CardContent>
    </Card>
  );
};
