import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  FileSearch,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  NotebookPen,
  Package,
  Settings,
  Ticket,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { moduleAccessStore } from "@/stores/module-access-store";

type LinkButtonProps = {
  to: string;
  label: ReactNode;
  variant?: "default" | "secondary";
};

const LinkButton = ({ to, label, variant = "default" }: LinkButtonProps) => {
  return (
    <Link to={to} className={buttonVariants({ variant, size: "sm" })}>
      {label}
    </Link>
  );
};

export const HomePage = () => {
  const { t } = useI18n();
  const role = useAuthStore.getState().role;
  const [moduleAccess, setModuleAccess] = useState(moduleAccessStore.getState().modules);
  const isTeam = role === "admin" || role === "developer";
  const isAdmin = role === "admin";

  useEffect(() => {
    const unsubscribe = moduleAccessStore.subscribe((state) => setModuleAccess(state.modules));
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("home.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("home.pageSubtitle")}</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Badge variant={moduleAccess.personal ? "success" : "neutral"}>{t("module.personal")}</Badge>
        <Badge variant={moduleAccess.work ? "success" : "neutral"}>{t("module.work")}</Badge>
        <Badge variant={moduleAccess.tickets ? "success" : "neutral"}>{t("module.tickets")}</Badge>
        <Badge variant={moduleAccess.assets ? "success" : "neutral"}>{t("module.assets")}</Badge>
        <Badge variant={moduleAccess.admin ? "success" : "neutral"}>{t("module.admin")}</Badge>
      </div>

      <div className="grid auto-rows-[minmax(150px,auto)] gap-4 lg:grid-cols-12">
        {moduleAccess.personal ? (
          <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 lg:col-span-7">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="size-4" />
                {t("module.personal")}
              </CardTitle>
              <CardDescription>{t("home.personalSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <LinkButton to="/tasks" label={t("nav.tasks")} />
              <LinkButton to="/notes" variant="secondary" label={t("nav.notes")} />
              <LinkButton to="/projects" variant="secondary" label={t("nav.projects")} />
              <LinkButton to="/weekly" variant="secondary" label={t("nav.weekly")} />
              {isTeam ? (
                <LinkButton to="/team-calendar" variant="secondary" label={t("nav.calendar")} />
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {moduleAccess.tickets ? (
          <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="size-4" />
                {t("module.tickets")}
              </CardTitle>
              <CardDescription>{t("home.ticketsSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <LinkButton to="/tickets/create" label={t("nav.ticketsCreate")} />
              {isTeam ? (
                <LinkButton to="/tickets/open" variant="secondary" label={t("nav.ticketsOpen")} />
              ) : null}
              <LinkButton to="/tickets/my" variant="secondary" label={t("nav.ticketsMy")} />
            </CardContent>
          </Card>
        ) : null}

        {moduleAccess.work && isTeam ? (
          <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="size-4" />
                {t("module.work")}
              </CardTitle>
              <CardDescription>{t("home.workSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <LinkButton to="/maintenance/dashboard" label={t("nav.maintenanceDashboard")} />
              <LinkButton to="/maintenance/registry" variant="secondary" label={t("nav.maintenanceRegistry")} />
              <LinkButton to="/maintenance/create" variant="secondary" label={t("nav.maintenanceCreate")} />
              <LinkButton to="/knowledge-base" variant="secondary" label={t("nav.knowledgeBase")} />
            </CardContent>
          </Card>
        ) : null}

        {moduleAccess.assets && isTeam ? (
          <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                {t("module.assets")}
              </CardTitle>
              <CardDescription>{t("home.assetsSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <LinkButton to="/assets/dashboard" label={t("nav.assetsDashboard")} />
              <LinkButton to="/assets/register" variant="secondary" label={t("nav.assetsRegister")} />
              <LinkButton to="/assets/list" variant="secondary" label={t("nav.assetsList")} />
            </CardContent>
          </Card>
        ) : null}

        {moduleAccess.admin && isAdmin ? (
          <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-4" />
                {t("module.admin")}
              </CardTitle>
              <CardDescription>{t("home.adminSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <LinkButton to="/admin" label={t("nav.dashboard")} />
              <LinkButton to="/admin/user-management" variant="secondary" label={t("nav.userManagement")} />
              <LinkButton to="/admin/module-access" variant="secondary" label={t("nav.moduleAccess")} />
              <LinkButton to="/admin/audit" variant="secondary" label={t("nav.auditLogs")} />
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-4" />
              {t("home.accountTitle")}
            </CardTitle>
            <CardDescription>{t("home.accountSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <LinkButton to="/account" label={<><User className="mr-1 size-3.5" />{t("nav.account")}</>} />
            {isAdmin ? (
              <LinkButton to="/admin/people" variant="secondary" label={<><Users className="mr-1 size-3.5" />{t("nav.peopleDirectory")}</>} />
            ) : null}
            {isTeam ? (
              <LinkButton to="/knowledge-base" variant="secondary" label={<><BookOpen className="mr-1 size-3.5" />{t("nav.knowledgeBase")}</>} />
            ) : null}
            {isTeam ? (
              <LinkButton to="/maintenance/registry" variant="secondary" label={<><ClipboardList className="mr-1 size-3.5" />{t("nav.maintenanceRegistry")}</>} />
            ) : null}
            {moduleAccess.personal ? (
              <LinkButton to="/notes" variant="secondary" label={<><NotebookPen className="mr-1 size-3.5" />{t("nav.notes")}</>} />
            ) : null}
            {moduleAccess.personal ? (
              <LinkButton to="/projects" variant="secondary" label={<><FolderKanban className="mr-1 size-3.5" />{t("nav.projects")}</>} />
            ) : null}
            {isAdmin ? (
              <LinkButton to="/admin/audit" variant="secondary" label={<><FileSearch className="mr-1 size-3.5" />{t("nav.auditLogs")}</>} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
