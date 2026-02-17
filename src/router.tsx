import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/pages/login-page";
import { DailyTasksPage } from "@/pages/daily-tasks-page";
import { useAuthStore } from "@/stores/auth-store";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  return isAuthenticated ? <Navigate to="/tasks" replace /> : children;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/tasks" replace />,
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/tasks",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <DailyTasksPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
]);
