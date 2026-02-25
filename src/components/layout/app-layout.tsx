import type { ReactNode } from "react";
import React from "react";
import type { LucideIcon } from "lucide-react";
import {
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
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n/i18n";
import { moduleAccessStore } from "@/stores/module-access-store";

const SIDEBAR_OPEN_KEY = "workplatform-sidebar-open";
const MODULE_OPEN_KEY = "workplatform-sidebar-modules";
const SECTION_OPEN_KEY = "workplatform-sidebar-sections";

type ModuleKey = "personal" | "work" | "assets" | "admin";
type SectionKey =
  | "personal-overview"
  | "personal-planning"
  | "personal-team"
  | "work-tickets"
  | "work-maintenance"
  | "work-knowledge"
  | "assets-inventory"
  | "admin-management"
  | "admin-security";

type ModuleState = {
  personal: boolean;
  work: boolean;
  assets: boolean;
  admin: boolean;
};

type SectionState = {
  "personal-overview": boolean;
  "personal-planning": boolean;
  "personal-team": boolean;
  "work-tickets": boolean;
  "work-maintenance": boolean;
  "work-knowledge": boolean;
  "assets-inventory": boolean;
  "admin-management": boolean;
  "admin-security": boolean;
};

type NavPage = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  active: boolean;
};

type NavSection = {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  pages: NavPage[];
  active: boolean;
};

type NavModule = {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  sections: NavSection[];
  active: boolean;
};

const DEFAULT_MODULE_STATE: ModuleState = {
  personal: false,
  work: false,
  assets: false,
  admin: false,
};

const DEFAULT_SECTION_STATE: SectionState = {
  "personal-overview": false,
  "personal-planning": false,
  "personal-team": false,
  "work-tickets": false,
  "work-maintenance": false,
  "work-knowledge": false,
  "assets-inventory": false,
  "admin-management": false,
  "admin-security": false,
};

const moduleIcons: Record<ModuleKey, LucideIcon> = {
  personal: User,
  work: BriefcaseBusiness,
  assets: Package,
  admin: Shield,
};

const sectionIcons: Record<SectionKey, LucideIcon> = {
  "personal-overview": LayoutDashboard,
  "personal-planning": ListTodo,
  "personal-team": CalendarDays,
  "work-tickets": Ticket,
  "work-maintenance": Wrench,
  "work-knowledge": BookOpen,
  "assets-inventory": ClipboardList,
  "admin-management": Users,
  "admin-security": KeyRound,
};

const isRouteActive = (pathname: string, to: string, end = false) => {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
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
  const [moduleOpen, setModuleOpen] = React.useState<ModuleState>(() => {
    const raw = localStorage.getItem(MODULE_OPEN_KEY);
    if (!raw) return DEFAULT_MODULE_STATE;
    try {
      const parsed = JSON.parse(raw) as Partial<ModuleState>;
      return {
        personal: parsed.personal ?? false,
        work: parsed.work ?? false,
        assets: parsed.assets ?? false,
        admin: parsed.admin ?? false,
      };
    } catch {
      return DEFAULT_MODULE_STATE;
    }
  });
  const [sectionOpen, setSectionOpen] = React.useState<SectionState>(() => {
    const raw = localStorage.getItem(SECTION_OPEN_KEY);
    if (!raw) return DEFAULT_SECTION_STATE;
    try {
      const parsed = JSON.parse(raw) as Partial<SectionState>;
      return {
        "personal-overview": parsed["personal-overview"] ?? false,
        "personal-planning": parsed["personal-planning"] ?? false,
        "personal-team": parsed["personal-team"] ?? false,
        "work-tickets": parsed["work-tickets"] ?? false,
        "work-maintenance": parsed["work-maintenance"] ?? false,
        "work-knowledge": parsed["work-knowledge"] ?? false,
        "assets-inventory": parsed["assets-inventory"] ?? false,
        "admin-management": parsed["admin-management"] ?? false,
        "admin-security": parsed["admin-security"] ?? false,
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
    localStorage.setItem(MODULE_OPEN_KEY, JSON.stringify(moduleOpen));
  }, [moduleOpen]);

  React.useEffect(() => {
    localStorage.setItem(SECTION_OPEN_KEY, JSON.stringify(sectionOpen));
  }, [sectionOpen]);

  React.useEffect(() => {
    const unsubscribe = moduleAccessStore.subscribe((next) => setModuleAccess(next.modules));
    moduleAccessStore.refreshMine().catch(() => null);
    return unsubscribe;
  }, []);

  const toggleModule = (module: ModuleKey) => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setModuleOpen((current) => ({ ...current, [module]: true }));
      return;
    }
    setModuleOpen((current) => ({ ...current, [module]: !current[module] }));
  };

  const toggleSection = (section: SectionKey) => {
    setSectionOpen((current) => ({ ...current, [section]: !current[section] }));
  };

  const renderModuleHeader = (module: NavModule) => {
    const Icon = moduleIcons[module.key];
    return (
      <button
        type="button"
        title={!isSidebarOpen ? module.label : undefined}
        className={`group relative flex w-full items-center rounded-md px-2 py-2 text-sm ${
          isSidebarOpen ? "justify-between" : "justify-center"
        } ${module.active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        onClick={() => toggleModule(module.key)}
      >
        <span className={`flex items-center ${isSidebarOpen ? "gap-2" : ""}`}>
          <Icon className="size-4 shrink-0" />
          {isSidebarOpen ? <span className="truncate font-medium">{module.label}</span> : null}
        </span>
        {isSidebarOpen ? (moduleOpen[module.key] ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />) : null}
        {!isSidebarOpen ? (
          <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block">
            {module.label}
          </span>
        ) : null}
      </button>
    );
  };

  const renderSectionHeader = (section: NavSection) => {
    const Icon = sectionIcons[section.key];
    return (
      <button
        type="button"
        className={`ml-2 flex w-[calc(100%-0.5rem)] items-center justify-between rounded-md px-2 py-1.5 text-xs uppercase tracking-wide ${
          section.active ? "text-foreground" : "text-muted-foreground/80 hover:text-muted-foreground"
        }`}
        onClick={() => toggleSection(section.key)}
      >
        <span className="flex items-center gap-2">
          <Icon className="size-3.5 shrink-0" />
          <span>{section.label}</span>
        </span>
        {sectionOpen[section.key] ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
    );
  };

  const renderNavLink = (to: string, label: string, Icon: LucideIcon, end = false) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        `ml-4 mr-1 flex items-center gap-2 rounded-md px-2 py-2 text-sm ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );

  const canAccessPersonal = moduleAccess.personal;
  const isTeamRole = userRole === "admin" || userRole === "developer";
  const canAccessWork = moduleAccess.work && isTeamRole;
  const canAccessTickets = moduleAccess.tickets;
  const canAccessAssets = moduleAccess.assets && isTeamRole;
  const canAccessAdmin = moduleAccess.admin && userRole === "admin";
  const hasWorkModule = canAccessTickets || canAccessWork;

  const modules = React.useMemo<NavModule[]>(() => {
    const toSection = (
      key: SectionKey,
      label: string,
      icon: LucideIcon,
      pages: Array<{ to: string; label: string; icon: LucideIcon; visible?: boolean; end?: boolean }>
    ): NavSection | null => {
      const visiblePages: NavPage[] = pages
        .filter((page) => page.visible ?? true)
        .map((page) => ({
          to: page.to,
          label: page.label,
          icon: page.icon,
          end: page.end,
          active: isRouteActive(location.pathname, page.to, page.end),
        }));
      if (visiblePages.length === 0) return null;
      return {
        key,
        label,
        icon,
        pages: visiblePages,
        active: visiblePages.some((page) => page.active),
      };
    };

    const personalSections = [
      toSection("personal-overview", t("nav.sectionOverview"), LayoutDashboard, [
        { to: "/dashboard", label: t("nav.dailyDashboard"), icon: LayoutDashboard },
      ]),
      toSection("personal-planning", t("nav.sectionPlanning"), ListTodo, [
        { to: "/tasks", label: t("nav.tasks"), icon: ListTodo },
        { to: "/notes", label: t("nav.notes"), icon: NotebookPen },
        { to: "/projects", label: t("nav.projects"), icon: FolderKanban },
        { to: "/weekly", label: t("nav.weekly"), icon: CalendarDays },
      ]),
      toSection("personal-team", t("nav.sectionTeam"), CalendarDays, [
        { to: "/team-calendar", label: t("nav.calendar"), icon: CalendarDays, visible: isTeamRole },
      ]),
    ].filter((section): section is NavSection => Boolean(section));

    const workSections = [
      toSection("work-tickets", t("nav.sectionTickets"), Ticket, [
        { to: "/tickets/create", label: t("nav.ticketsCreate"), icon: Ticket, visible: canAccessTickets },
        { to: "/tickets/open", label: t("nav.ticketsOpen"), icon: Inbox, visible: canAccessTickets && isTeamRole },
        { to: "/tickets/my", label: t("nav.ticketsMy"), icon: User, visible: canAccessTickets },
      ]),
      toSection("work-maintenance", t("nav.sectionMaintenance"), Wrench, [
        { to: "/maintenance/dashboard", label: t("nav.maintenanceDashboard"), icon: Wrench, visible: canAccessWork },
        { to: "/maintenance/registry", label: t("nav.maintenanceRegistry"), icon: ClipboardList, visible: canAccessWork },
        { to: "/maintenance/create", label: t("nav.maintenanceCreate"), icon: CheckSquare, visible: canAccessWork },
      ]),
      toSection("work-knowledge", t("nav.sectionKnowledge"), BookOpen, [
        { to: "/knowledge-base", label: t("nav.knowledgeBase"), icon: BookOpen, visible: canAccessWork },
      ]),
    ].filter((section): section is NavSection => Boolean(section));

    const assetSections = [
      toSection("assets-inventory", t("nav.sectionInventory"), ClipboardList, [
        { to: "/assets/dashboard", label: t("nav.assetsDashboard"), icon: LayoutDashboard },
        { to: "/assets/register", label: t("nav.assetsRegister"), icon: Package },
        { to: "/assets/list", label: t("nav.assetsList"), icon: ClipboardList },
      ]),
    ].filter((section): section is NavSection => Boolean(section));

    const adminSections = [
      toSection("admin-management", t("nav.sectionManagement"), Users, [
        { to: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
        { to: "/admin/user-management", label: t("nav.userManagement"), icon: User },
        { to: "/admin/people", label: t("nav.peopleDirectory"), icon: Users },
        { to: "/admin/users", label: t("nav.adminUsers"), icon: Users },
      ]),
      toSection("admin-security", t("nav.sectionSecurity"), KeyRound, [
        { to: "/admin/module-access", label: t("nav.moduleAccess"), icon: KeyRound },
        { to: "/admin/audit", label: t("nav.auditLogs"), icon: FileSearch },
      ]),
    ].filter((section): section is NavSection => Boolean(section));

    const candidateModules: Array<NavModule | null> = [
      canAccessPersonal
        ? {
            key: "personal",
            label: t("nav.personal"),
            icon: moduleIcons.personal,
            sections: personalSections,
            active: personalSections.some((section) => section.active),
          }
        : null,
      hasWorkModule
        ? {
            key: "work",
            label: t("nav.work"),
            icon: moduleIcons.work,
            sections: workSections,
            active: workSections.some((section) => section.active),
          }
        : null,
      canAccessAssets
        ? {
            key: "assets",
            label: t("nav.assets"),
            icon: moduleIcons.assets,
            sections: assetSections,
            active: assetSections.some((section) => section.active),
          }
        : null,
      canAccessAdmin
        ? {
            key: "admin",
            label: t("nav.admin"),
            icon: moduleIcons.admin,
            sections: adminSections,
            active: adminSections.some((section) => section.active),
          }
        : null,
    ];

    return candidateModules.filter((module): module is NavModule => Boolean(module && module.sections.length > 0));
  }, [t, location.pathname, canAccessPersonal, canAccessWork, canAccessTickets, canAccessAssets, canAccessAdmin, hasWorkModule, isTeamRole]);

  React.useEffect(() => {
    const activeModule = modules.find((module) => module.active);
    if (activeModule && !moduleOpen[activeModule.key]) {
      setModuleOpen((current) => ({ ...current, [activeModule.key]: true }));
    }
    const activeSection = activeModule?.sections.find((section) => section.active);
    if (activeSection && !sectionOpen[activeSection.key]) {
      setSectionOpen((current) => ({ ...current, [activeSection.key]: true }));
    }
  }, [modules, moduleOpen, sectionOpen]);

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

          <div className={`space-y-3 pb-6 ${isSidebarOpen ? "px-3" : "px-2"}`}>
            {modules.map((module) => (
              <div key={module.key} className="space-y-1">
                {renderModuleHeader(module)}
                {isSidebarOpen && moduleOpen[module.key] ? (
                  <div className="space-y-1 pb-1">
                    {module.sections.map((section) => (
                      <div key={section.key} className="space-y-1">
                        {renderSectionHeader(section)}
                        {sectionOpen[section.key] ? <nav className="space-y-1">{section.pages.map((page) => renderNavLink(page.to, page.label, page.icon, page.end))}</nav> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
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
