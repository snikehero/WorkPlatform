import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { adminStore } from "@/stores/admin-store";
import type { AppUser } from "@/types/user";

type UserDraft = {
  email: string;
  role: "admin" | "developer" | "user";
  resetPassword: string;
};

export const AdminUsersPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [activationLinks, setActivationLinks] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    const data = await adminStore.allUsers();
    setUsers(data);
    setDrafts((current) => {
      const next = { ...current };
      for (const user of data) {
        if (!next[user.id]) {
          next[user.id] = { email: user.email, role: user.role, resetPassword: "" };
        }
      }
      return next;
    });
  };

  useEffect(() => {
    loadUsers().catch(() => setUsers([]));
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => [user.email, user.role].join(" ").toLowerCase().includes(term));
  }, [users, search]);

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
    if (!draft?.resetPassword.trim()) {
      const errorMessage = t("admin.resetEnterPassword");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
      return;
    }
    setMessage(null);
    try {
      await adminStore.resetPassword(userId, draft.resetPassword.trim());
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
          <div className="mb-4">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("admin.searchPlaceholder")} />
          </div>
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.noUsers")}</p>
          ) : (
            <ul className="space-y-3">
              {filteredUsers.map((user) => {
                const draft = drafts[user.id] ?? {
                  email: user.email,
                  role: user.role,
                  resetPassword: "",
                };
                const activationLink = activationLinks[user.id];
                return (
                  <li key={user.id} className="rounded-md border border-border bg-card p-3">
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
          )}
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
