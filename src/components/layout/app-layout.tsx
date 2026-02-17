import type { ReactNode } from "react";
import React from "react";
import { CheckSquare, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n/i18n";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const authState = useAuthStore.getState();
  const userEmail = authState.userEmail;
  const userRole = authState.role;
  const { t } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleTheme = () => {
    const activeTheme = (resolvedTheme ?? theme) as "light" | "dark" | undefined;
    setTheme(activeTheme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    useAuthStore.logout();
    navigate("/login");
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
              {isSidebarOpen ? (
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  {t("nav.personal")}
                </p>
              ) : null}
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
            </div>

            <div className="space-y-2">
              {isSidebarOpen ? (
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("nav.dashboards")}</p>
              ) : null}
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
            </div>

            <div className="space-y-2">
              {isSidebarOpen ? (
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{t("nav.work")}</p>
              ) : null}
              <nav className="space-y-1">
                {(userRole === "admin" || userRole === "developer") ? (
                  <>
                    <NavLink
                      to="/pc-maintenance"
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-2 text-sm ${
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      {t("nav.pcMaintenance")}
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
                <NavLink
                  to="/assets"
                  className={({ isActive }) =>
                    `block rounded-md px-2 py-2 text-sm ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {t("nav.assets")}
                </NavLink>
              </nav>
            </div>
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
