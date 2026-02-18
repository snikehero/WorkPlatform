import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { DailyNotesPage } from "@/pages/daily-notes-page";
import { LoginPage } from "@/pages/login-page";
import { ProjectsPage } from "@/pages/projects-page";
import { DailyTasksPage } from "@/pages/daily-tasks-page";
import { WeeklyReviewPage } from "@/pages/weekly-review-page";
import { TeamCalendarPage } from "@/pages/team-calendar-page";
import { AssetMaintenancePage } from "@/pages/asset-maintenance-page";
import { AdminDashboardPage } from "@/pages/admin-dashboard-page";
import { AdminUsersPage } from "@/pages/admin-users-page";
import { TicketsCreatePage } from "@/pages/tickets-create-page";
import { TicketsOpenPage } from "@/pages/tickets-open-page";
import { TicketsMyPage } from "@/pages/tickets-my-page";
import { TicketsUserDetailPage } from "@/pages/tickets-user-detail-page";
import { TicketSolutionPage } from "@/pages/ticket-solution-page";
import { AccountPage } from "@/pages/account-page";
import { DailyDashboardPage } from "@/pages/daily-dashboard-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { KnowledgeBasePage } from "@/pages/knowledge-base-page";
import { AssetInventoryPage } from "@/pages/asset-inventory-page";
import { AssetListPage } from "@/pages/asset-list-page";
import { UserManagementPage } from "@/pages/user-management-page";
import { PeopleDirectoryPage } from "@/pages/people-directory-page";
import { useAuthStore } from "@/stores/auth-store";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  return auth.role === "admin" ? children : <Navigate to="/dashboard" replace />;
};

const TeamRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  return auth.role === "admin" || auth.role === "developer" ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

const TicketsIndexRoute = () => {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  if (auth.role === "admin" || auth.role === "developer") {
    return <Navigate to="/tickets/open" replace />;
  }
  return <Navigate to="/tickets/create" replace />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <DailyDashboardPage />
        </AppLayout>
      </ProtectedRoute>
    ),
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
      <TeamRoute>
        <AppLayout>
          <TeamCalendarPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/pc-maintenance",
    element: (
      <TeamRoute>
        <Navigate to="/asset-maintenance" replace />
      </TeamRoute>
    ),
  },
  {
    path: "/asset-maintenance",
    element: (
      <TeamRoute>
        <AppLayout>
          <AssetMaintenancePage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/tickets",
    element: (
      <ProtectedRoute>
        <TicketsIndexRoute />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/create",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <TicketsCreatePage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/open",
    element: (
      <TeamRoute>
        <AppLayout>
          <TicketsOpenPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/tickets/my",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <TicketsMyPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/my/:ticketId",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <TicketsUserDetailPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/:ticketId",
    element: (
      <TeamRoute>
        <AppLayout>
          <TicketSolutionPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <NotificationsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/knowledge-base",
    element: (
      <TeamRoute>
        <AppLayout>
          <KnowledgeBasePage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/assets",
    element: (
      <TeamRoute>
        <Navigate to="/assets/register" replace />
      </TeamRoute>
    ),
  },
  {
    path: "/assets/register",
    element: (
      <TeamRoute>
        <AppLayout>
          <AssetInventoryPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/assets/register/:assetId",
    element: (
      <TeamRoute>
        <AppLayout>
          <AssetInventoryPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/assets/list",
    element: (
      <TeamRoute>
        <AppLayout>
          <AssetListPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AppLayout>
          <AdminDashboardPage />
        </AppLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/user-management",
    element: (
      <AdminRoute>
        <AppLayout>
          <UserManagementPage />
        </AppLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/people",
    element: (
      <AdminRoute>
        <AppLayout>
          <PeopleDirectoryPage />
        </AppLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AdminRoute>
        <AppLayout>
          <AdminUsersPage />
        </AppLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/account",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <AccountPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
]);
