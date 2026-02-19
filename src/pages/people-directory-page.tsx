import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { loadSavedView, saveSavedView } from "@/lib/saved-views";
import { peopleStore } from "@/stores/people-store";
import type { ManagedPerson } from "@/types/person";

type SortBy = "name" | "email" | "role" | "department" | "updatedAt" | "createdAt";
type SortDir = "asc" | "desc";

const SAVED_VIEW_ID = "admin-people";
const DEFAULT_PAGE_SIZE = 20;

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
  "Past Employee",
] as const;

type SavedView = {
  search: string;
  roleFilter: "" | "admin" | "developer" | "user";
  departmentFilter: string;
  sortBy: SortBy;
  sortDir: SortDir;
  pageSize: number;
};

const DEFAULT_VIEW: SavedView = {
  search: "",
  roleFilter: "",
  departmentFilter: "",
  sortBy: "name",
  sortDir: "asc",
  pageSize: DEFAULT_PAGE_SIZE,
};

export const PeopleDirectoryPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const savedView = loadSavedView<SavedView>(SAVED_VIEW_ID, DEFAULT_VIEW);

  const [people, setPeople] = useState<ManagedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(savedView.search);
  const [roleFilter, setRoleFilter] = useState<SavedView["roleFilter"]>(savedView.roleFilter);
  const [departmentFilter, setDepartmentFilter] = useState(savedView.departmentFilter);
  const [sortBy, setSortBy] = useState<SortBy>(savedView.sortBy);
  const [sortDir, setSortDir] = useState<SortDir>(savedView.sortDir);
  const [pageSize, setPageSize] = useState(savedView.pageSize);

  const loadPeople = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = await peopleStore.list({
        search,
        role: roleFilter,
        department: departmentFilter,
        sortBy,
        sortDir,
        page,
        pageSize,
      });
      setPeople(data.items);
      setTotal(data.total);
      setSelectedIds({});
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("people.empty"));
      setPeople([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    saveSavedView(SAVED_VIEW_ID, { search, roleFilter, departmentFilter, sortBy, sortDir, pageSize });
  }, [search, roleFilter, departmentFilter, sortBy, sortDir, pageSize]);

  useEffect(() => {
    loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, departmentFilter, sortBy, sortDir, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const selectedPersonIds = useMemo(() => people.filter((item) => selectedIds[item.id]).map((item) => item.id), [people, selectedIds]);
  const allVisibleSelected = people.length > 0 && selectedPersonIds.length === people.length;

  const handleDelete = async (personId: string) => {
    try {
      await peopleStore.remove(personId);
      showToast(t("people.deleted"), "success");
      await loadPeople();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("people.saveFailed"), "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPersonIds.length === 0) return;
    if (!window.confirm(t("people.bulkDeleteConfirm", { count: String(selectedPersonIds.length) }))) return;
    try {
      const result = await peopleStore.bulkRemove(selectedPersonIds);
      showToast(t("people.bulkDeleted", { count: String(result.deleted) }), "success");
      if (page > 1 && people.length === result.deleted) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        await loadPeople();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("people.bulkDeleteFailed"), "error");
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
          <div className="mb-3 grid gap-2 md:grid-cols-6">
            <Input
              className="md:col-span-2"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("people.searchPlaceholder")}
            />
            <Select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value as SavedView["roleFilter"]);
                setPage(1);
              }}
            >
              <option value="">{t("admin.anyRole")}</option>
              <option value="user">{t("common.user")}</option>
              <option value="developer">{t("common.developer")}</option>
              <option value="admin">{t("common.admin")}</option>
            </Select>
            <Select
              value={departmentFilter}
              onChange={(event) => {
                setDepartmentFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("people.anyDepartment")}</option>
              {DEPARTMENT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <Select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortBy);
                setPage(1);
              }}
            >
              <option value="name">{t("people.sortName")}</option>
              <option value="email">{t("people.sortEmail")}</option>
              <option value="role">{t("people.sortRole")}</option>
              <option value="department">{t("people.sortDepartment")}</option>
              <option value="updatedAt">{t("people.sortUpdatedAt")}</option>
              <option value="createdAt">{t("people.sortCreatedAt")}</option>
            </Select>
            <Select
              value={sortDir}
              onChange={(event) => {
                setSortDir(event.target.value as SortDir);
                setPage(1);
              }}
            >
              <option value="asc">{t("admin.sortAsc")}</option>
              <option value="desc">{t("admin.sortDesc")}</option>
            </Select>
            <Select
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </Select>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/user-management")}>
              {t("people.createTitle")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleBulkDelete} disabled={selectedPersonIds.length === 0}>
              {t("people.bulkDeletePeople", { count: String(selectedPersonIds.length) })}
            </Button>
          </div>
          {isLoading ? <LoadingState /> : null}
          {!isLoading && loadError ? <ErrorState label={loadError} onRetry={loadPeople} /> : null}
          {!isLoading && !loadError && people.length === 0 ? <EmptyState label={t("people.empty")} /> : null}
          {!isLoading && !loadError && people.length > 0 ? (
            <DataTableShell minWidthClass="min-w-[1050px]">
              <thead className="text-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSelectedIds((current) => {
                          const next = { ...current };
                          for (const item of people) {
                            if (checked) next[item.id] = true;
                            else delete next[item.id];
                          }
                          return next;
                        });
                      }}
                    />
                  </th>
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
                {people.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedIds[item.id])}
                        onChange={(event) =>
                          setSelectedIds((current) => ({
                            ...current,
                            [item.id]: event.target.checked,
                          }))
                        }
                      />
                    </td>
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
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("admin.paginationSummary", { total: String(total), page: String(page), totalPages: String(totalPages) })}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                {t("common.previous")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
