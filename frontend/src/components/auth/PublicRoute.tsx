import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    if (user.account_status === 'PENDING') {
      return <Navigate to="/pending" replace />;
    }
    if (user.account_status === 'SUSPENDED' || user.account_status === 'DEACTIVATED') {
      return <Navigate to="/suspended" replace />;
    }
    switch (user.role) {
      case 'INFORMAL_AGGREGATOR':
        return <Navigate to="/aggregator/dashboard" replace />;
      case 'COLLECTION_COLLECTOR':
        return <Navigate to="/collector/dashboard" replace />;
      case 'AUTHORIZED_RECYCLER':
        return <Navigate to="/recycler/dashboard" replace />;
      case 'GOVERNMENT_ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/user/dashboard" replace />;
    }
  }

  return <Outlet />;
};
