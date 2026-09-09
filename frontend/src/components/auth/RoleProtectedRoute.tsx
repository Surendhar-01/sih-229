import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { ForbiddenPage } from '../../pages/auth/ForbiddenPage';

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Account status enforcement: PENDING/SUSPENDED/REJECTED accounts cannot access operational dashboards
  if (user.account_status === 'PENDING') {
    return <Navigate to="/pending" replace />;
  }

  if (user.account_status === 'SUSPENDED' || user.account_status === 'DEACTIVATED') {
    return <Navigate to="/suspended" replace />;
  }

  if (user.account_status === 'REJECTED') {
    return <Navigate to="/rejected" replace />;
  }

  // RBAC Role check
  if (!allowedRoles.includes(user.role)) {
    return <ForbiddenPage requiredRoles={allowedRoles} userRole={user.role} />;
  }

  return <Outlet />;
};
