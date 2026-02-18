import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/i18n";

export const AdminDashboardPage = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.pageSubtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("people.pageTitle")}</CardTitle>
          <CardDescription>{t("admin.peopleFlowSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("admin.peopleFlowHint")}</p>
            <Link to="/admin/user-management">
              <Button type="button">{t("admin.openUserManagement")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.usersPageTitle")}</CardTitle>
          <CardDescription>{t("admin.usersPageSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("admin.usersPageHint")}</p>
            <Link to="/admin/users">
              <Button type="button" variant="secondary">{t("admin.openUsersPage")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
