import type { ReactNode } from "react";
import { CheckSquare, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const userEmail = useAuthStore.getState().userEmail;
  const { theme, setTheme, resolvedTheme } = useTheme();

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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/tasks" className="inline-flex items-center gap-2 font-semibold text-foreground">
            <CheckSquare className="size-5 text-sky-500" />
            Work Platform
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground sm:flex">
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }
            >
              Tasks
            </NavLink>
            <NavLink
              to="/notes"
              className={({ isActive }) =>
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }
            >
              Notes
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }
            >
              Projects
            </NavLink>
            <NavLink
              to="/weekly"
              className={({ isActive }) =>
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }
            >
              Weekly
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {resolvedTheme === "dark" ? (
                <Sun className="mr-1 size-4" />
              ) : (
                <Moon className="mr-1 size-4" />
              )}
              {resolvedTheme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 size-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
};
