import type { ReactNode } from "react";
import { CheckSquare, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const userEmail = useAuthStore.getState().userEmail;

  const handleLogout = () => {
    useAuthStore.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/tasks" className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <CheckSquare className="size-5 text-sky-600" />
            Work Platform
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{userEmail}</span>
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
