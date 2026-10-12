import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import Spinner from "./Spinner.jsx";

// pages that need a login
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// landing, login and register are skipped when already logged in
export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
