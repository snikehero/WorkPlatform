import type { ReactNode } from "react";
import React from "react";
import { CheckSquare, ChevronDown, ChevronRight, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n/i18n";

const SIDEBAR_OPEN_KEY = "workplatform-sidebar-open";
const SECTION_OPEN_KEY = "workplatform-sidebar-sections";

type SectionState = {
  personal: boolean;
  dashboards: boolean;
  work: boolean;
  assets: boolean;
};

const DEFAULT_SECTION_STATE: SectionState = {
  personal: true,
  dashboards: true,
  work: true,
  assets: true,
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const authState = useAuthStore.getState();
  const userEmail = authState.userEmail;
  const userRole = authState.role;
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
        dashboards: parsed.dashboards ?? true,
        work: parsed.work ?? true,
        assets: parsed.assets ?? true,
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

  React.useEffect(() => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, isSidebarOpen ? "1" : "0");
  }, [isSidebarOpen]);

  React.useEffect(() => {
    localStorage.setItem(SECTION_OPEN_KEY, JSON.stringify(sectionOpen));
  }, [sectionOpen]);

  const toggleSection = (section: "personal" | "dashboards" | "work" | "assets") => {
    setSectionOpen((current) => ({ ...current, [section]: !current[section] }));
  };

  const renderSectionHeader = (section: "personal" | "dashboards" | "work" | "assets", label: string) => {
    if (!isSidebarOpen) return null;
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between text-xs uppercase tracking-wide text-muted-foreground/70 hover:text-muted-foreground"
        onClick={() => toggleSection(section)}
      >
        <span>{label}</span>
        {sectionOpen[section] ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={`border-r border-border bg-card transition-all duration-200 ${
            isSidebarOpen ? "w-64" : "w-16"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 font-semibold text-foreground">
              <CheckSquare className="size-5 text-sky-500" />
              {isSidebarOpen ? t("app.name") : null}
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen((open) => !open)}>
              <Menu className="size-4" />
            </Button>
          </div>

          <div className="space-y-4 px-3 pb-6">
            <div className="space-y-2">
              {renderSectionHeader("personal", t("nav.personal"))}
              {(!isSidebarOpen || sectionOpen.personal) ? (
                <nav className="space-y-1">
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.dailyDashboard")}
                  </NavLink>
                  <NavLink
                    to="/tasks"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.tasks")}
                  </NavLink>
                  <NavLink
                    to="/notes"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.notes")}
                  </NavLink>
                  <NavLink
                    to="/projects"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.projects")}
                  </NavLink>
                  <NavLink
                    to="/account"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.account")}
                  </NavLink>
                </nav>
              ) : null}
            </div>

            <div className="space-y-2">
              {renderSectionHeader("dashboards", t("nav.dashboards"))}
              {(!isSidebarOpen || sectionOpen.dashboards) ? (
                <nav className="space-y-1">
                  <NavLink
                    to="/weekly"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.weekly")}
                  </NavLink>
                  {(userRole === "admin" || userRole === "developer") ? (
                    <>
                      <NavLink
                        to="/team-calendar"
                        className={({ isActive }) =>
                          `block rounded-md px-2 py-2 text-sm ${
                            isActive
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`
                        }
                      >
                        {t("nav.calendar")}
                      </NavLink>
                    </>
                  ) : null}
                </nav>
              ) : null}
            </div>

            <div className="space-y-2">
              {renderSectionHeader("work", t("nav.work"))}
              {(!isSidebarOpen || sectionOpen.work) ? (
                <nav className="space-y-1">
                  {(userRole === "admin" || userRole === "developer") ? (
                    <>
                      <NavLink
                        to="/asset-maintenance"
                        className={({ isActive }) =>
                          `block rounded-md px-2 py-2 text-sm ${
                            isActive
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`
                        }
                      >
                        {t("nav.assetMaintenance")}
                      </NavLink>
                    </>
                  ) : null}
                  <NavLink
                    to="/tickets"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.tickets")}
                  </NavLink>
                  <NavLink
                    to="/notifications"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.notifications")}
                  </NavLink>
                  {(userRole === "admin" || userRole === "developer") ? (
                    <NavLink
                      to="/knowledge-base"
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-2 text-sm ${
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      {t("nav.knowledgeBase")}
                    </NavLink>
                  ) : null}
                </nav>
              ) : null}
            </div>
            {(userRole === "admin" || userRole === "developer") ? (
              <div className="space-y-2">
                {renderSectionHeader("assets", t("nav.assetsSection"))}
                {(!isSidebarOpen || sectionOpen.assets) ? (
                  <nav className="space-y-1">
                    <NavLink
                      to="/assets/register"
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-2 text-sm ${
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      {t("nav.assetsRegister")}
                    </NavLink>
                    <NavLink
                      to="/assets/list"
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-2 text-sm ${
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      {t("nav.assetsList")}
                    </NavLink>
                  </nav>
                ) : null}
              </div>
            ) : null}
            {userRole === "admin" ? (
              <div className="space-y-2">
                {isSidebarOpen ? (
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("nav.admin")}</p>
                ) : null}
                <nav className="space-y-1">
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    {t("nav.dashboard")}
                  </NavLink>
                </nav>
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
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {resolvedTheme === "dark" ? (
                    <Sun className="mr-1 size-4" />
                  ) : (
                    <Moon className="mr-1 size-4" />
                  )}
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
