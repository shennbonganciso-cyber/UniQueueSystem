import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";
import { Root } from "./components/Root";
import { LoginPage } from "./components/LoginPage";
import { StudentDashboard } from "./components/StudentDashboard";
import { ServiceSelection } from "./components/ServiceSelection";
import { QueueConfirmation } from "./components/QueueConfirmation";
import { StaffDashboard } from "./components/StaffDashboard";
import { QueueMonitoring } from "./components/QueueMonitoring";
import { ReportsPage } from "./components/ReportsPage";
import { StudentSettings } from "./components/StudentSettings";
import { RouteGuard } from "./components/RouteGuard";

const routes: RouteObject[] = [
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LoginPage },
      {
        path: "student",
        element: (
          <RouteGuard allowedRoles={["student"]}>
            <StudentDashboard />
          </RouteGuard>
        ),
        children: [
          { path: "settings", Component: StudentSettings },
        ],
      },
      { path: "services", Component: ServiceSelection },
      { path: "queue-confirmation", Component: QueueConfirmation },
      {
        path: "staff",
        element: (
          <RouteGuard allowedRoles={["staff", "admin"]}>
            <StaffDashboard />
          </RouteGuard>
        ),
      },
      { path: "monitor", Component: QueueMonitoring },
      { path: "reports", Component: ReportsPage },
    ],
  },
];

export const router = createBrowserRouter(routes);
