import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n";
import { MODULES } from "@/lib/module-access";
import { moduleAccessStore } from "@/stores/module-access-store";
import { adminStore } from "@/stores/admin-store";
import type { AppModule, AppRole, RoleModuleAccess } from "@/types/module-access";
import { useAuthStore } from "@/stores/auth-store";

const ROLE_OPTIONS: AppRole[] = ["admin", "developer", "user"];

export const AdminModuleAccessPage = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<AppRole>("developer");
  const [items, setItems] = useState<RoleModuleAccess[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busyModule, setBusyModule] = useState<AppModule | null>(null);
  const currentRole = useAuthStore.getState().role;

  const loadData = async () => {
    const data = await adminStore.allModuleAccess();
    setItems(data);
  };

  useEffect(() => {
    loadData().catch(() => setItems([]));
  }, []);

  const byRole = useMemo(() => {
    const map = new Map<AppModule, RoleModuleAccess>();
    for (const item of items) {
      if (item.role === selectedRole) map.set(item.module, item);
    }
    return map;
  }, [items, selectedRole]);

  const toggleModule = async (module: AppModule, enabled: boolean) => {
    setMessage(null);
    setBusyModule(module);
    try {
      const saved = await adminStore.updateModuleAccess(selectedRole, module, enabled);
      setItems((current) => {
        const next = current.filter((item) => !(item.role === selectedRole && item.module === module));
        next.push(saved);
        return next;
      });
      const success = t("admin.moduleAccessSaved");
      setMessage(success);
      showToast(success, "success");
      if (currentRole && currentRole === selectedRole) {
        await moduleAccessStore.refreshMine().catch(() => null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("admin.moduleAccessSaveFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setBusyModule(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.moduleAccessTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.moduleAccessSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.moduleAccessRoleTitle")}</CardTitle>
          <CardDescription>{t("admin.moduleAccessRoleSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="module-access-role">{t("common.role")}</Label>
            <Select
              id="module-access-role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as AppRole)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {t(`common.${role}`)}
                </option>
              ))}
            </Select>
          </div>

          <ul className="space-y-3">
            {MODULES.map((module) => {
              const item = byRole.get(module);
              const enabled = item?.enabled ?? false;
              return (
                <li key={module} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t(`module.${module}`)}</p>
                    <p className="text-xs text-muted-foreground">{enabled ? t("admin.moduleEnabled") : t("admin.moduleDisabled")}</p>
                  </div>
                  <Button
                    type="button"
                    variant={enabled ? "secondary" : "default"}
                    disabled={busyModule === module}
                    onClick={() => toggleModule(module, !enabled)}
                  >
                    {enabled ? t("admin.turnOff") : t("admin.turnOn")}
                  </Button>
                </li>
              );
            })}
          </ul>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};
