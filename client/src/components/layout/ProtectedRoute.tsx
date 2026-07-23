import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  // While we're validating the saved token, show nothing (prevents flash of login page)
  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}