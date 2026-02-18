import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n";
import { peopleStore } from "@/stores/people-store";
import type { ManagedPerson } from "@/types/person";

export const PeopleDirectoryPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [people, setPeople] = useState<ManagedPerson[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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

  const handleDelete = async (personId: string) => {
    setMessage(null);
    try {
      await peopleStore.remove(personId);
      setMessage(t("people.deleted"));
      await loadPeople();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("people.saveFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("people.listTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("people.listSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("people.listTitle")}</CardTitle>
          <CardDescription>{t("people.listSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("people.searchPlaceholder")} />
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/user-management")}>
              {t("people.createTitle")}
            </Button>
          </div>
          {filteredPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("people.empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.name")}</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.email")}</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.mobile")}</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.title")}</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.role")}</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.department")}</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.notes")}</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">{t("people.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPeople.map((item) => (
                    <tr key={item.id} className="border-t border-border align-top">
                      <td className="px-3 py-2 text-foreground">{item.name || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.email || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.mobile || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.title || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.role || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.department || "-"}</td>
                      <td className="max-w-[240px] truncate px-3 py-2 text-muted-foreground" title={item.notes || "-"}>
                        {item.notes || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => navigate(`/admin/user-management?personId=${item.id}`)}>
                            {t("people.edit")}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                            {t("common.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};

