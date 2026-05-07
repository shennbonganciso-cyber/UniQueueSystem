import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { LoginPage } from "./components/LoginPage";
import { StudentDashboard } from "./components/StudentDashboard";
import { ServiceSelection } from "./components/ServiceSelection";
import { QueueConfirmation } from "./components/QueueConfirmation";
import { StaffDashboard } from "./components/StaffDashboard";
import { QueueMonitoring } from "./components/QueueMonitoring";
import { ReportsPage } from "./components/ReportsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LoginPage },
      { path: "student", Component: StudentDashboard },
      { path: "services", Component: ServiceSelection },
      { path: "queue-confirmation", Component: QueueConfirmation },
      { path: "staff", Component: StaffDashboard },
      { path: "monitor", Component: QueueMonitoring },
      { path: "reports", Component: ReportsPage },
    ],
  },
]);
