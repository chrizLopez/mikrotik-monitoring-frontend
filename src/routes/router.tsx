import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/features/auth/auth-context";

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const DashboardOverviewPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardOverviewPage").then((module) => ({
    default: module.DashboardOverviewPage,
  })),
);
const IspDetailPage = lazy(() =>
  import("@/features/isps/pages/IspDetailPage").then((module) => ({ default: module.IspDetailPage })),
);
const StatusPage = lazy(() =>
  import("@/features/status/pages/StatusPage").then((module) => ({ default: module.StatusPage })),
);
const UserDetailPage = lazy(() =>
  import("@/features/users/pages/UserDetailPage").then((module) => ({ default: module.UserDetailPage })),
);
const UsersPage = lazy(() =>
  import("@/features/users/pages/UsersPage").then((module) => ({ default: module.UsersPage })),
);

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState label="Loading page..." />}>{children}</Suspense>;
}

function ProtectedLayout() {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingState label="Checking session..." />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingState label="Checking session..." />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <LazyPage>
      <LoginPage />
    </LazyPage>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <PublicOnlyRoute />,
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <DashboardOverviewPage />
          </LazyPage>
        ),
      },
      {
        path: "isps/:ispId",
        element: (
          <LazyPage>
            <IspDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "users",
        element: (
          <LazyPage>
            <UsersPage />
          </LazyPage>
        ),
      },
      {
        path: "users/:userId",
        element: (
          <LazyPage>
            <UserDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "status",
        element: (
          <LazyPage>
            <StatusPage />
          </LazyPage>
        ),
      },
    ],
  },
]);
