import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/i18n";
import { peopleStore } from "@/stores/people-store";
import type { ManagedPerson } from "@/types/person";

type PersonDraft = {
  name: string;
  email: string;
  title: string;
  role: string;
  department: string;
  mobile: string;
  notes: string;
};

const DEPARTMENT_OPTIONS = [
  "Direccion",
  "Administracion",
  "Comercial",
  "Capital Humano",
  "Calidad",
  "Compras",
  "Automatizacion",
  "Dise\u00f1o Electrico",
  "HMI",
  "BMS",
  "Mantenimiento",
  "Construccion",
  "Desarrollo",
  "Electricidad y Fuerza",
  "Administracion de Proyectos",
] as const;

const EMPTY_DRAFT: PersonDraft = {
  name: "",
  email: "",
  title: "",
  role: "user",
  department: "Direccion",
  mobile: "",
  notes: "",
};

export const UserManagementPage = () => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [people, setPeople] = useState<ManagedPerson[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<PersonDraft>(EMPTY_DRAFT);

  const loadPeople = async () => {
    const data = await peopleStore.all();
    setPeople(data);
  };

  useEffect(() => {
    loadPeople().catch(() => setPeople([]));
  }, []);

  useEffect(() => {
    const personId = searchParams.get("personId");
    if (!personId) {
      setActiveId(null);
      setDraft(EMPTY_DRAFT);
      return;
    }
    const selected = people.find((item) => item.id === personId);
    if (!selected) return;
    const normalizedRole = (selected.role || "").toLowerCase();
    const roleValue = normalizedRole === "admin" || normalizedRole === "developer" ? normalizedRole : "user";
    const departmentValue = DEPARTMENT_OPTIONS.includes(selected.department as (typeof DEPARTMENT_OPTIONS)[number])
      ? selected.department
      : "Direccion";
    setActiveId(selected.id);
    setDraft({
      name: selected.name,
      email: selected.email,
      title: selected.title,
      role: roleValue,
      department: departmentValue,
      mobile: selected.mobile,
      notes: selected.notes,
    });
  }, [people, searchParams]);

  const resetForm = () => {
    setActiveId(null);
    setDraft(EMPTY_DRAFT);
    setSearchParams({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!draft.name.trim()) {
      setMessage(t("people.requiredName"));
      return;
    }
    const payload = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      title: draft.title.trim(),
      role: draft.role.trim().toLowerCase(),
      department: draft.department.trim(),
      mobile: draft.mobile.trim(),
      notes: draft.notes.trim(),
    };
    try {
      if (activeId) {
        await peopleStore.update(activeId, payload);
        setMessage(t("people.updated"));
      } else {
        await peopleStore.add(payload);
        setMessage(t("people.created"));
      }
      await loadPeople();
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("people.saveFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("people.createTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("people.formSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{activeId ? t("people.editTitle") : t("people.createTitle")}</CardTitle>
          <CardDescription>{t("people.formSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="person-name">{t("people.name")}</Label>
              <Input id="person-name" value={draft.name} onChange={(event) => setDraft((c) => ({ ...c, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-email">{t("people.email")}</Label>
              <Input id="person-email" value={draft.email} onChange={(event) => setDraft((c) => ({ ...c, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-mobile">{t("people.mobile")}</Label>
              <Input id="person-mobile" value={draft.mobile} onChange={(event) => setDraft((c) => ({ ...c, mobile: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-title">{t("people.title")}</Label>
              <Input id="person-title" value={draft.title} onChange={(event) => setDraft((c) => ({ ...c, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-role">{t("people.role")}</Label>
              <Select id="person-role" value={draft.role} onChange={(event) => setDraft((c) => ({ ...c, role: event.target.value }))}>
                <option value="user">{t("common.user")}</option>
                <option value="developer">{t("common.developer")}</option>
                <option value="admin">{t("common.admin")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-department">{t("people.department")}</Label>
              <Select id="person-department" value={draft.department} onChange={(event) => setDraft((c) => ({ ...c, department: event.target.value }))}>
                {DEPARTMENT_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="person-notes">{t("people.notes")}</Label>
              <Textarea id="person-notes" value={draft.notes} onChange={(event) => setDraft((c) => ({ ...c, notes: event.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit">{activeId ? t("common.save") : t("people.create")}</Button>
              {activeId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  {t("people.cancelEdit")}
                </Button>
              ) : null}
              <Link to="/admin/people">
                <Button type="button" variant="secondary">{t("people.listTitle")}</Button>
              </Link>
            </div>
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
