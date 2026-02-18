import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  const [people, setPeople] = useState<ManagedPerson[]>([]);
  const [search, setSearch] = useState("");
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

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return people;
    return people.filter((item) =>
      [item.name, item.email, item.title, item.role, item.department, item.mobile].join(" ").toLowerCase().includes(term)
    );
  }, [people, search]);

  const resetForm = () => {
    setActiveId(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleEdit = (item: ManagedPerson) => {
    const normalizedRole = (item.role || "").toLowerCase();
    const roleValue = normalizedRole === "admin" || normalizedRole === "developer" ? normalizedRole : "user";
    const departmentValue = DEPARTMENT_OPTIONS.includes(item.department as (typeof DEPARTMENT_OPTIONS)[number]) ? item.department : "Direccion";
    setActiveId(item.id);
    setDraft({
      name: item.name,
      email: item.email,
      title: item.title,
      role: roleValue,
      department: departmentValue,
      mobile: item.mobile,
      notes: item.notes,
    });
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
      resetForm();
      await loadPeople();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("people.saveFailed"));
    }
  };

  const handleDelete = async (personId: string) => {
    setMessage(null);
    try {
      await peopleStore.remove(personId);
      if (activeId === personId) resetForm();
      setMessage(t("people.deleted"));
      await loadPeople();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("people.saveFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("people.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("people.pageSubtitle")}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
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
              </div>
            </form>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("people.listTitle")}</CardTitle>
            <CardDescription>{t("people.listSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("people.searchPlaceholder")} />
            </div>
            {filteredPeople.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("people.empty")}</p>
            ) : (
              <ul className="space-y-3">
                {filteredPeople.map((item) => (
                  <li key={item.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.email || "-"} | {item.title || "-"} | {item.mobile || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("people.role")}: {item.role || "-"} | {t("people.department")}: {item.department || "-"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                          {t("people.edit")}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


