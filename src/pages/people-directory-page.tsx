import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { peopleStore } from "@/stores/people-store";
import type { ManagedPerson } from "@/types/person";

export const PeopleDirectoryPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [people, setPeople] = useState<ManagedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadPeople = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = await peopleStore.all();
      setPeople(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("people.empty"));
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return people;
    return people.filter((item) =>
      [item.name, item.email, item.title, item.role, item.department, item.mobile].join(" ").toLowerCase().includes(term)
    );
  }, [people, search]);

  const handleDelete = async (personId: string) => {
    try {
      await peopleStore.remove(personId);
      showToast(t("people.deleted"), "success");
      await loadPeople();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("people.saveFailed"), "error");
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
          {isLoading ? <LoadingState /> : null}
          {!isLoading && loadError ? <ErrorState label={loadError} onRetry={loadPeople} /> : null}
          {!isLoading && !loadError && filteredPeople.length === 0 ? <EmptyState label={t("people.empty")} /> : null}
          {!isLoading && !loadError && filteredPeople.length > 0 ? (
            <DataTableShell minWidthClass="min-w-[1000px]">
              <thead className="text-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t("people.name")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("people.email")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("people.mobile")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("people.title")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("people.role")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("people.department")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("people.notes")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("people.actions")}</th>
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
            </DataTableShell>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
