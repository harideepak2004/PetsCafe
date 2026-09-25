import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { EmptyState, Spinner } from "./ui";
import { ShieldAlert } from "lucide-react";

export default function ProtectedRoute({ staff = false }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (staff && !user.is_staff) {
    return (
      <div className="container page">
        <EmptyState icon={ShieldAlert} title="Staff only">This page is for Pets Cafe staff.</EmptyState>
      </div>
    );
  }
  return <Outlet />;
}
