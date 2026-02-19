import type { ReactNode } from "react";
import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileSearch,
  FolderKanban,
  Inbox,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Package,
  Shield,
  Sun,
  Ticket,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n/i18n";
import { moduleAccessStore } from "@/stores/module-access-store";

const SIDEBAR_OPEN_KEY = "workplatform-sidebar-open";
const SECTION_OPEN_KEY = "workplatform-sidebar-sections";

type SectionKey = "personal" | "work" | "tickets" | "assets" | "admin";

type SectionState = {
  personal: boolean;
  work: boolean;
  tickets: boolean;
  assets: boolean;
  admin: boolean;
};

const DEFAULT_SECTION_STATE: SectionState = {
  personal: true,
  work: true,
  tickets: true,
  assets: true,
  admin: true,
};

const sectionIcons: Record<SectionKey, LucideIcon> = {
  personal: User,
  work: BriefcaseBusiness,
  tickets: Ticket,
  assets: Package,
  admin: Shield,
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const authState = useAuthStore.getState();
  const userEmail = authState.userEmail;
  const userRole = authState.role;
  const [moduleAccess, setModuleAccess] = React.useState(moduleAccessStore.getState().modules);
  const { t } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    const raw = localStorage.getItem(SIDEBAR_OPEN_KEY);
    return raw === null ? true : raw === "1";
  });
  const [sectionOpen, setSectionOpen] = React.useState<SectionState>(() => {
    const raw = localStorage.getItem(SECTION_OPEN_KEY);
    if (!raw) return DEFAULT_SECTION_STATE;
    try {
      const parsed = JSON.parse(raw) as Partial<SectionState>;
      return {
        personal: parsed.personal ?? true,
        work: parsed.work ?? true,
        tickets: parsed.tickets ?? true,
        assets: parsed.assets ?? true,
        admin: parsed.admin ?? true,
      };
    } catch {
      return DEFAULT_SECTION_STATE;
    }
  });

  const toggleTheme = () => {
    const activeTheme = (resolvedTheme ?? theme) as "light" | "dark" | undefined;
    setTheme(activeTheme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    useAuthStore.logout();
    navigate("/login");
  };

  const handleAccount = () => {
    navigate("/account");
  };

  React.useEffect(() => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, isSidebarOpen ? "1" : "0");
  }, [isSidebarOpen]);

  React.useEffect(() => {
    localStorage.setItem(SECTION_OPEN_KEY, JSON.stringify(sectionOpen));
  }, [sectionOpen]);

  React.useEffect(() => {
    const unsubscribe = moduleAccessStore.subscribe((next) => setModuleAccess(next.modules));
    moduleAccessStore.refreshMine().catch(() => null);
    return unsubscribe;
  }, []);

  const toggleSection = (section: SectionKey) => {
    setSectionOpen((current) => ({ ...current, [section]: !current[section] }));
  };

  const renderSectionHeader = (section: SectionKey, label: string) => {
    if (!isSidebarOpen) return null;
    const Icon = sectionIcons[section];
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground/70 hover:text-muted-foreground"
        onClick={() => toggleSection(section)}
      >
        <span className="flex items-center gap-2">
          <Icon className="size-3.5" />
          <span>{label}</span>
        </span>
        {sectionOpen[section] ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
    );
  };

  const renderNavLink = (to: string, label: string, Icon: LucideIcon) => (
    <NavLink
      key={to}
      to={to}
      title={isSidebarOpen ? undefined : label}
      className={({ isActive }) =>
        `group relative flex items-center rounded-md px-2 py-2 text-sm ${
          isSidebarOpen ? "justify-start gap-2" : "justify-center"
        } ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`
      }
    >
      <Icon className="size-4 shrink-0" />
      {isSidebarOpen ? <span className="truncate">{label}</span> : null}
      {!isSidebarOpen ? (
        <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block">
          {label}
        </span>
      ) : null}
    </NavLink>
  );

  const canAccessPersonal = moduleAccess.personal;
  const canAccessWork = moduleAccess.work;
  const canAccessTickets = moduleAccess.tickets;
  const canAccessAssets = moduleAccess.assets && (userRole === "admin" || userRole === "developer");
  const canAccessAdmin = moduleAccess.admin && userRole === "admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`border-r border-border bg-card transition-all duration-200 ${isSidebarOpen ? "w-64" : "w-16"}`}>
          <div className={`flex h-16 items-center ${isSidebarOpen ? "justify-between px-3" : "justify-center px-2"}`}>
            <Link to="/dashboard" className="inline-flex items-center gap-2 font-semibold text-foreground" title={t("app.name")}>
              <CheckSquare className="size-5 text-sky-500" />
              {isSidebarOpen ? t("app.name") : null}
            </Link>
            {isSidebarOpen ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                onClick={() => setIsSidebarOpen((open) => !open)}
              >
                <Menu className="size-4" />
              </Button>
            ) : null}
          </div>

          {!isSidebarOpen ? (
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                aria-label="Expand sidebar"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
            </div>
          ) : null}

          <div className={`space-y-4 pb-6 ${isSidebarOpen ? "px-3" : "px-2"}`}>
            {canAccessPersonal ? (
              <div className="space-y-2">
                {renderSectionHeader("personal", t("nav.personal"))}
                {sectionOpen.personal ? (
                  <nav className="space-y-1">
                    {renderNavLink("/dashboard", t("nav.dailyDashboard"), LayoutDashboard)}
                    {renderNavLink("/tasks", t("nav.tasks"), ListTodo)}
                    {renderNavLink("/notes", t("nav.notes"), NotebookPen)}
                    {renderNavLink("/projects", t("nav.projects"), FolderKanban)}
                    {renderNavLink("/weekly", t("nav.weekly"), CalendarDays)}
                    {(userRole === "admin" || userRole === "developer")
                      ? renderNavLink("/team-calendar", t("nav.calendar"), CalendarDays)
                      : null}
                  </nav>
                ) : null}
              </div>
            ) : null}

            {canAccessWork ? (
              <div className="space-y-2">
                {renderSectionHeader("work", t("nav.work"))}
                {sectionOpen.work ? (
                  <nav className="space-y-1">
                    {(userRole === "admin" || userRole === "developer") ? (
                      <>
                        {renderNavLink("/maintenance/dashboard", t("nav.maintenanceDashboard"), Wrench)}
                        {renderNavLink("/maintenance/registry", t("nav.maintenanceRegistry"), ClipboardList)}
                        {renderNavLink("/maintenance/create", t("nav.maintenanceCreate"), CheckSquare)}
                      </>
                    ) : null}
                    {renderNavLink("/notifications", t("nav.notifications"), Bell)}
                    {(userRole === "admin" || userRole === "developer")
                      ? renderNavLink("/knowledge-base", t("nav.knowledgeBase"), BookOpen)
                      : null}
                  </nav>
                ) : null}
              </div>
            ) : null}

            {canAccessTickets ? (
              <div className="space-y-2">
                {renderSectionHeader("tickets", t("nav.ticketsSection"))}
                {sectionOpen.tickets ? (
                  <nav className="space-y-1">
                    {renderNavLink("/tickets/create", t("nav.ticketsCreate"), Ticket)}
                    {(userRole === "admin" || userRole === "developer")
                      ? renderNavLink("/tickets/open", t("nav.ticketsOpen"), Inbox)
                      : null}
                    {renderNavLink("/tickets/my", t("nav.ticketsMy"), User)}
                  </nav>
                ) : null}
              </div>
            ) : null}

            {canAccessAssets ? (
              <div className="space-y-2">
                {renderSectionHeader("assets", t("nav.assetsSection"))}
                {sectionOpen.assets ? (
                  <nav className="space-y-1">
                    {renderNavLink("/assets/dashboard", t("nav.assetsDashboard"), LayoutDashboard)}
                    {renderNavLink("/assets/register", t("nav.assetsRegister"), Package)}
                    {renderNavLink("/assets/list", t("nav.assetsList"), ClipboardList)}
                  </nav>
                ) : null}
              </div>
            ) : null}

            {canAccessAdmin ? (
              <div className="space-y-2">
                {renderSectionHeader("admin", t("nav.admin"))}
                {sectionOpen.admin ? (
                  <nav className="space-y-1">
                    {renderNavLink("/admin", t("nav.dashboard"), LayoutDashboard)}
                    {renderNavLink("/admin/user-management", t("nav.userManagement"), User)}
                    {renderNavLink("/admin/people", t("nav.peopleDirectory"), Users)}
                    {renderNavLink("/admin/users", t("nav.adminUsers"), Users)}
                    {renderNavLink("/admin/module-access", t("nav.moduleAccess"), KeyRound)}
                    {renderNavLink("/admin/audit", t("nav.auditLogs"), FileSearch)}
                  </nav>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{userEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleAccount}>
                  <User className="mr-1 size-4" />
                  {t("nav.account")}
                </Button>
                <Button variant="ghost" size="sm" aria-label="Toggle theme" onClick={toggleTheme}>
                  {resolvedTheme === "dark" ? <Sun className="mr-1 size-4" /> : <Moon className="mr-1 size-4" />}
                  {resolvedTheme === "dark" ? t("common.light") : t("common.dark")}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1 size-4" />
                  {t("common.logout")}
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
