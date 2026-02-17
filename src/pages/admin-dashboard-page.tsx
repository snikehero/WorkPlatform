import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { adminStore } from "@/stores/admin-store";
import type { AppUser } from "@/types/user";
import { useI18n } from "@/i18n/i18n";

type UserDraft = {
  email: string;
  role: "admin" | "developer" | "user";
  resetPassword: string;
};

export const AdminDashboardPage = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "developer" | "user">("user");
  const [message, setMessage] = useState<string | null>(null);

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

  const usernameHint = useMemo(() => {
    const value = email.trim().toLowerCase();
    if (!value) return "";
    const normalized = value.includes("@") ? value : `${value}@workplatform.local`;
    return normalized;
  }, [email]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    try {
      await adminStore.createUser(email.trim(), password.trim(), role);
      setEmail("");
      setPassword("");
      setRole("user");
      setMessage(t("admin.created"));
      await loadUsers();
    } catch (error) {
      const text = error instanceof Error ? error.message : t("admin.createFailed");
      setMessage(text);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft) return;
    setMessage(null);
    try {
      await adminStore.updateUser(userId, draft.email.trim(), draft.role);
      setMessage(t("admin.updated"));
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("admin.updateFailed"));
    }
  };

  const handleResetPassword = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft?.resetPassword.trim()) {
      setMessage(t("admin.resetEnterPassword"));
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
      setMessage(t("admin.resetDone"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("admin.resetFailed"));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setMessage(null);
    try {
      await adminStore.deleteUser(userId);
      setMessage(t("admin.deleted"));
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("admin.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.pageSubtitle")}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.createTitle")}</CardTitle>
          <CardDescription>{t("admin.createSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateUser}>
            <div className="space-y-2">
              <Label htmlFor="admin-user-email">{t("admin.emailOrUsername")}</Label>
              <Input
                id="admin-user-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("admin.emailOrUsernamePlaceholder")}
              />
              {usernameHint ? (
                <p className="text-xs text-muted-foreground">{t("admin.storedAs")}: {usernameHint}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-password">{t("common.password")}</Label>
              <Input
                id="admin-user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("admin.passwordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-role">{t("common.role")}</Label>
              <Select
                id="admin-user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as "admin" | "developer" | "user")}
              >
                <option value="user">{t("common.user")}</option>
                <option value="developer">{t("common.developer")}</option>
                <option value="admin">{t("common.admin")}</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit">{t("admin.create")}</Button>
            </div>
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.usersTitle")}</CardTitle>
          <CardDescription>{t("admin.usersSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.noUsers")}</p>
          ) : (
            <ul className="space-y-3">
              {users.map((user) => {
                const draft = drafts[user.id] ?? {
                  email: user.email,
                  role: user.role,
                  resetPassword: "",
                };
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
                        <Button type="button" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("admin.createdPrefix")}: {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
