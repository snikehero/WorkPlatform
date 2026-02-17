import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { DailyNotesPage } from "@/pages/daily-notes-page";
import { LoginPage } from "@/pages/login-page";
import { ProjectsPage } from "@/pages/projects-page";
import { DailyTasksPage } from "@/pages/daily-tasks-page";
import { WeeklyReviewPage } from "@/pages/weekly-review-page";
import { TeamCalendarPage } from "@/pages/team-calendar-page";
import { PcMaintenancePage } from "@/pages/pc-maintenance-page";
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
  {
    path: "/notes",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <DailyNotesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ProjectsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/weekly",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <WeeklyReviewPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/team-calendar",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <TeamCalendarPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pc-maintenance",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <PcMaintenancePage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
]);
