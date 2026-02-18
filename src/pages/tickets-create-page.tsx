import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ticketStore } from "@/stores/ticket-store";
import type { TicketCategory, TicketPriority } from "@/types/ticket";
import { useI18n } from "@/i18n/i18n";

export const TicketsCreatePage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("help");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState<string | null>(null);

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!title.trim()) {
      const errorMessage = t("tickets.requiredTitle");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }
    try {
      await ticketStore.add(title.trim(), description.trim(), category, priority);
      setTitle("");
      setDescription("");
      setCategory("help");
      setPriority("medium");
      const successMessage = t("tickets.created");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("tickets.createFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("tickets.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("tickets.assignSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets.createTicketTitle")}</CardTitle>
          <CardDescription>{t("tickets.createTicketSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateTicket}>
            <div className="space-y-2">
              <Label htmlFor="ticket-title">{t("common.title")}</Label>
              <Input
                id="ticket-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("tickets.titlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-category">{t("common.category")}</Label>
              <Select id="ticket-category" value={category} onChange={(event) => setCategory(event.target.value as TicketCategory)}>
                <option value="help">{t("tickets.category.help")}</option>
                <option value="printer">{t("tickets.category.printer")}</option>
                <option value="network">{t("tickets.category.network")}</option>
                <option value="software">{t("tickets.category.software")}</option>
                <option value="hardware">{t("tickets.category.hardware")}</option>
                <option value="access">{t("tickets.category.access")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">{t("common.priority")}</Label>
              <Select id="ticket-priority" value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority)}>
                <option value="low">{t("tickets.priority.low")}</option>
                <option value="medium">{t("tickets.priority.medium")}</option>
                <option value="high">{t("tickets.priority.high")}</option>
                <option value="critical">{t("tickets.priority.critical")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-description">{t("common.description")}</Label>
              <Textarea
                id="ticket-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("tickets.descriptionPlaceholder")}
              />
            </div>
            <Button type="submit">{t("tickets.create")}</Button>
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
