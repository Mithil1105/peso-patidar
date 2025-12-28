import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "engineer" | "employee" | "cashier")[];
  requireMasterAdmin?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireMasterAdmin }: ProtectedRouteProps) {
  const { user, userRole, isMasterAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireMasterAdmin && !isMasterAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole) && !isMasterAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
