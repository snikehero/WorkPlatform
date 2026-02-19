import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { DailyNotesPage } from "@/pages/daily-notes-page";
import { LoginPage } from "@/pages/login-page";
import { ProjectsPage } from "@/pages/projects-page";
import { DailyTasksPage } from "@/pages/daily-tasks-page";
import { WeeklyReviewPage } from "@/pages/weekly-review-page";
import { TeamCalendarPage } from "@/pages/team-calendar-page";
import { MaintenanceCreatePage } from "@/pages/maintenance-create-page";
import { MaintenanceDashboardPage } from "@/pages/maintenance-dashboard-page";
import { MaintenanceRegistryPage } from "@/pages/maintenance-registry-page";
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
import { AssetDashboardPage } from "@/pages/asset-dashboard-page";
import { UserManagementPage } from "@/pages/user-management-page";
import { PeopleDirectoryPage } from "@/pages/people-directory-page";
import { useAuthStore } from "@/stores/auth-store";
import { moduleAccessStore } from "@/stores/module-access-store";
import { getDefaultLandingPath } from "@/lib/module-access";
import type { AppModule } from "@/types/module-access";
import { AdminModuleAccessPage } from "@/pages/admin-module-access-page";

const getLandingPath = () => {
  const auth = useAuthStore.getState();
  return getDefaultLandingPath(auth.role, moduleAccessStore.getState().modules);
};

const ProtectedRoute = ({ children, module }: { children: React.ReactNode; module?: AppModule }) => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (module && !moduleAccessStore.canAccess(module)) return <Navigate to={getLandingPath()} replace />;
  return children;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  return isAuthenticated ? <Navigate to={getLandingPath()} replace /> : children;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  if (auth.role !== "admin") return <Navigate to={getLandingPath()} replace />;
  return moduleAccessStore.canAccess("admin") ? children : <Navigate to={getLandingPath()} replace />;
};

const TeamRoute = ({ children, module }: { children: React.ReactNode; module: AppModule }) => {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  if (!moduleAccessStore.canAccess(module)) return <Navigate to={getLandingPath()} replace />;
  return auth.role === "admin" || auth.role === "developer" ? (
    children
  ) : (
    <Navigate to={getLandingPath()} replace />
  );
};

const TicketsIndexRoute = () => {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  if (!moduleAccessStore.canAccess("tickets")) return <Navigate to={getLandingPath()} replace />;
  if (auth.role === "admin" || auth.role === "developer") {
    return <Navigate to="/tickets/open" replace />;
  }
  return <Navigate to="/tickets/create" replace />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={getLandingPath()} replace />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute module="personal">
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
      <ProtectedRoute module="personal">
        <AppLayout>
          <DailyTasksPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/notes",
    element: (
      <ProtectedRoute module="personal">
        <AppLayout>
          <DailyNotesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects",
    element: (
      <ProtectedRoute module="personal">
        <AppLayout>
          <ProjectsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/weekly",
    element: (
      <ProtectedRoute module="personal">
        <AppLayout>
          <WeeklyReviewPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/team-calendar",
    element: (
      <TeamRoute module="personal">
        <AppLayout>
          <TeamCalendarPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/pc-maintenance",
    element: (
      <TeamRoute module="work">
        <Navigate to="/maintenance/create" replace />
      </TeamRoute>
    ),
  },
  {
    path: "/asset-maintenance",
    element: (
      <TeamRoute module="work">
        <Navigate to="/maintenance/create" replace />
      </TeamRoute>
    ),
  },
  {
    path: "/maintenance/dashboard",
    element: (
      <TeamRoute module="work">
        <AppLayout>
          <MaintenanceDashboardPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/maintenance",
    element: (
      <TeamRoute module="work">
        <Navigate to="/maintenance/dashboard" replace />
      </TeamRoute>
    ),
  },
  {
    path: "/maintenance/registry",
    element: (
      <TeamRoute module="work">
        <AppLayout>
          <MaintenanceRegistryPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/maintenance/create",
    element: (
      <TeamRoute module="work">
        <AppLayout>
          <MaintenanceCreatePage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/tickets",
    element: (
      <ProtectedRoute module="tickets">
        <TicketsIndexRoute />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/create",
    element: (
      <ProtectedRoute module="tickets">
        <AppLayout>
          <TicketsCreatePage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/open",
    element: (
      <TeamRoute module="tickets">
        <AppLayout>
          <TicketsOpenPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/tickets/my",
    element: (
      <ProtectedRoute module="tickets">
        <AppLayout>
          <TicketsMyPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/my/:ticketId",
    element: (
      <ProtectedRoute module="tickets">
        <AppLayout>
          <TicketsUserDetailPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets/:ticketId",
    element: (
      <TeamRoute module="tickets">
        <AppLayout>
          <TicketSolutionPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/notifications",
    element: (
      <ProtectedRoute module="work">
        <AppLayout>
          <NotificationsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/knowledge-base",
    element: (
      <TeamRoute module="work">
        <AppLayout>
          <KnowledgeBasePage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/assets",
    element: (
      <TeamRoute module="assets">
        <Navigate to="/assets/dashboard" replace />
      </TeamRoute>
    ),
  },
  {
    path: "/assets/dashboard",
    element: (
      <TeamRoute module="assets">
        <AppLayout>
          <AssetDashboardPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/assets/register",
    element: (
      <TeamRoute module="assets">
        <AppLayout>
          <AssetInventoryPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/assets/register/:assetId",
    element: (
      <TeamRoute module="assets">
        <AppLayout>
          <AssetInventoryPage />
        </AppLayout>
      </TeamRoute>
    ),
  },
  {
    path: "/assets/list",
    element: (
      <TeamRoute module="assets">
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
    path: "/admin/module-access",
    element: (
      <AdminRoute>
        <AppLayout>
          <AdminModuleAccessPage />
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
