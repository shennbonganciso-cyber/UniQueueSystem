import React from "react";
import { Navigate } from "react-router";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const userRole = sessionStorage.getItem("userRole");

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Clear session and redirect to login
    sessionStorage.clear();
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};