import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/page-state";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { loadSavedView, saveSavedView } from "@/lib/saved-views";
import { adminStore } from "@/stores/admin-store";
import type { AppUser } from "@/types/user";

type UserDraft = {
  email: string;
  role: "admin" | "developer" | "user";
  resetPassword: string;
};

type SortBy = "createdAt" | "email" | "role";
type SortDir = "asc" | "desc";

const SAVED_VIEW_ID = "admin-users";
const DEFAULT_PAGE_SIZE = 20;

type SavedView = {
  search: string;
  roleFilter: "" | "admin" | "developer" | "user";
  sortBy: SortBy;
  sortDir: SortDir;
  pageSize: number;
};

const DEFAULT_VIEW: SavedView = {
  search: "",
  roleFilter: "",
  sortBy: "createdAt",
  sortDir: "desc",
  pageSize: DEFAULT_PAGE_SIZE,
};

export const AdminUsersPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const savedView = loadSavedView<SavedView>(SAVED_VIEW_ID, DEFAULT_VIEW);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [activationLinks, setActivationLinks] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(savedView.search);
  const [roleFilter, setRoleFilter] = useState<SavedView["roleFilter"]>(savedView.roleFilter);
  const [sortBy, setSortBy] = useState<SortBy>(savedView.sortBy);
  const [sortDir, setSortDir] = useState<SortDir>(savedView.sortDir);
  const [pageSize, setPageSize] = useState(savedView.pageSize);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminStore.listUsers({
        search,
        role: roleFilter,
        sortBy,
        sortDir,
        page,
        pageSize,
      });
      setUsers(data.items);
      setTotal(data.total);
      setSelectedIds({});
      setDrafts((current) => {
        const next = { ...current };
        for (const user of data.items) {
          if (!next[user.id]) {
            next[user.id] = { email: user.email, role: user.role, resetPassword: "" };
          }
        }
        return next;
      });
    } catch (error) {
      setUsers([]);
      setTotal(0);
      const errorMessage = error instanceof Error ? error.message : t("admin.usersLoadFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    saveSavedView(SAVED_VIEW_ID, { search, roleFilter, sortBy, sortDir, pageSize });
  }, [search, roleFilter, sortBy, sortDir, pageSize]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, sortBy, sortDir, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const selectedUserIds = useMemo(() => users.filter((user) => selectedIds[user.id]).map((user) => user.id), [selectedIds, users]);
  const allVisibleSelected = users.length > 0 && selectedUserIds.length === users.length;

  const handleUpdateUser = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft) return;
    setMessage(null);
    try {
      await adminStore.updateUser(userId, draft.email.trim(), draft.role);
      const successMessage = t("admin.updated");
      setMessage(successMessage);
      showToast(successMessage, "success");
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("admin.updateFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const handleResetPassword = async (userId: string) => {
    const draft = drafts[userId];
    const nextPassword = draft?.resetPassword.trim() ?? "";
    if (!nextPassword) {
      const errorMessage = t("admin.resetEnterPassword");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }
    if (nextPassword.length < 6) {
      const errorMessage = t("admin.resetMinLength");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }
    setMessage(null);
    try {
      await adminStore.resetPassword(userId, nextPassword);
      setDrafts((current) => ({
        ...current,
        [userId]: {
          ...current[userId],
          resetPassword: "",
        },
      }));
      const successMessage = t("admin.resetDone");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("admin.resetFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setMessage(null);
    try {
      await adminStore.deleteUser(userId);
      const successMessage = t("admin.deleted");
      setMessage(successMessage);
      showToast(successMessage, "success");
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("admin.deleteFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(t("admin.bulkDeleteConfirm", { count: String(selectedUserIds.length) }))) return;
    setMessage(null);
    try {
      const result = await adminStore.bulkDeleteUsers(selectedUserIds);
      const successMessage = t("admin.bulkDeleted", { count: String(result.deleted) });
      setMessage(successMessage);
      showToast(successMessage, "success");
      if (page > 1 && users.length === result.deleted) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        await loadUsers();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("admin.bulkDeleteFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const handleGenerateActivationLink = async (userId: string) => {
    setMessage(null);
    try {
      const result = await adminStore.generateActivationLink(userId);
      const activationLink = `${window.location.origin}/activate?token=${encodeURIComponent(result.activationToken)}`;
      setActivationLinks((current) => ({ ...current, [userId]: activationLink }));
      const successMessage = t("admin.activationLinkGenerated");
      setMessage(successMessage);
      showToast(successMessage, "info");
      await loadUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("admin.activationLinkFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const handleCopyActivationLink = async (userId: string) => {
    const link = activationLinks[userId];
    if (!link) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const temp = document.createElement("textarea");
        temp.value = link;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }
      showToast(t("admin.activationLinkCopied"), "success");
    } catch {
      showToast(t("admin.activationLinkFailed"), "error");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.usersPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.usersPageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.usersTitle")}</CardTitle>
          <CardDescription>{t("admin.usersSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-6">
            <Input
              className="md:col-span-2"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("admin.searchPlaceholder")}
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
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortBy);
                setPage(1);
              }}
            >
              <option value="createdAt">{t("admin.sortCreatedAt")}</option>
              <option value="email">{t("admin.sortEmail")}</option>
              <option value="role">{t("admin.sortRole")}</option>
            </Select>
            <Select
              value={sortDir}
              onChange={(event) => {
                setSortDir(event.target.value as SortDir);
                setPage(1);
              }}
            >
              <option value="desc">{t("admin.sortDesc")}</option>
              <option value="asc">{t("admin.sortAsc")}</option>
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

          <div className="mb-4 flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setSelectedIds((current) => {
                    const next = { ...current };
                    for (const user of users) {
                      if (checked) next[user.id] = true;
                      else delete next[user.id];
                    }
                    return next;
                  });
                }}
              />
              {t("admin.selectAllVisible")}
            </label>
            <Button type="button" variant="destructive" onClick={handleBulkDeleteUsers} disabled={selectedUserIds.length === 0}>
              {t("admin.bulkDeleteUsers", { count: String(selectedUserIds.length) })}
            </Button>
          </div>

          {isLoading ? <LoadingState /> : null}
          {!isLoading && users.length === 0 ? <p className="text-sm text-muted-foreground">{t("admin.noUsers")}</p> : null}
          {!isLoading ? (
            <ul className="space-y-3">
              {users.map((user) => {
                const draft = drafts[user.id] ?? {
                  email: user.email,
                  role: user.role,
                  resetPassword: "",
                };
                const activationLink = activationLinks[user.id];
                return (
                  <li key={user.id} className="rounded-md border border-border bg-card p-3">
                    <div className="mb-3">
                      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedIds[user.id])}
                          onChange={(event) =>
                            setSelectedIds((current) => ({
                              ...current,
                              [user.id]: event.target.checked,
                            }))
                          }
                        />
                        {t("admin.selectUser")}
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`user-email-${user.id}`}>{t("admin.emailOrUsername")}</Label>
                        <Input
                          id={`user-email-${user.id}`}
                          value={draft.email}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [user.id]: {
                                ...draft,
                                email: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`user-role-${user.id}`}>{t("common.role")}</Label>
                        <Select
                          id={`user-role-${user.id}`}
                          value={draft.role}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [user.id]: {
                                ...draft,
                                role: event.target.value as "admin" | "developer" | "user",
                              },
                            }))
                          }
                        >
                          <option value="user">{t("common.user")}</option>
                          <option value="developer">{t("common.developer")}</option>
                          <option value="admin">{t("common.admin")}</option>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`reset-password-${user.id}`}>{t("admin.masterReset")}</Label>
                        <Input
                          id={`reset-password-${user.id}`}
                          type="password"
                          value={draft.resetPassword}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [user.id]: {
                                ...draft,
                                resetPassword: event.target.value,
                              },
                            }))
                          }
                          placeholder={t("admin.newPasswordPlaceholder")}
                        />
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => handleUpdateUser(user.id)}>
                          {t("common.save")}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => handleResetPassword(user.id)}>
                          {t("admin.resetPassword")}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => handleGenerateActivationLink(user.id)}>
                          {t("admin.generateResetLink")}
                        </Button>
                        <Button type="button" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("admin.createdPrefix")}: {new Date(user.createdAt).toLocaleString()}
                    </p>
                    {activationLink ? (
                      <div className="mt-3 space-y-2">
                        <Label htmlFor={`activation-link-${user.id}`}>{t("admin.activationLinkLabel")}</Label>
                        <div className="flex gap-2">
                          <Input id={`activation-link-${user.id}`} value={activationLink} readOnly />
                          <Button type="button" variant="secondary" onClick={() => handleCopyActivationLink(user.id)}>
                            {t("common.copy")}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
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
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
