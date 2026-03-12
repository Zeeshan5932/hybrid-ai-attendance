import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps routes that require authentication.
 * If allowedRole is provided, also enforces role-based access.
 * Students are redirected to /my-attendance; teachers go to /.
 */
export default function ProtectedRoute({ allowedRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to the appropriate home page for their actual role
    const fallback = user.role === "student" ? "/my-attendance" : "/";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
