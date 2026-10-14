import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../services/auth/authService";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}