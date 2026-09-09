import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { RoleLayout } from '../layouts/RoleLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { AccountPendingPage } from '../pages/auth/AccountPendingPage';
import { AccountSuspendedPage } from '../pages/auth/AccountSuspendedPage';
import { AccountRejectedPage } from '../pages/auth/AccountRejectedPage';
import { ForbiddenPage } from '../pages/auth/ForbiddenPage';
import { ProfilePage } from '../pages/profile/ProfilePage';

import { UserDashboard } from '../pages/dashboards/UserDashboard';
import { CreateLotPage } from '../pages/lots/CreateLotPage';
import { MyLotsPage } from '../pages/lots/MyLotsPage';
import { LotDetailPage } from '../pages/lots/LotDetailPage';
import { AggregatorDashboard } from '../pages/dashboards/AggregatorDashboard';
import { CollectorDashboard } from '../pages/dashboards/CollectorDashboard';
import { RecyclerDashboard } from '../pages/dashboards/RecyclerDashboard';
import { AdminDashboard } from '../pages/dashboards/AdminDashboard';

import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '../components/auth/RoleProtectedRoute';
import { PublicRoute } from '../components/auth/PublicRoute';
import { useAuthStore } from '../store/authStore';

export const AppRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  const getDefaultRedirect = () => {
    if (!isAuthenticated || !user) return '/login';
    if (user.account_status === 'PENDING') return '/pending';
    if (user.account_status === 'SUSPENDED' || user.account_status === 'DEACTIVATED') return '/suspended';
    if (user.account_status === 'REJECTED') return '/rejected';

    switch (user.role) {
      case 'INFORMAL_AGGREGATOR':
        return '/aggregator/dashboard';
      case 'COLLECTION_COLLECTOR':
        return '/collector/dashboard';
      case 'AUTHORIZED_RECYCLER':
        return '/recycler/dashboard';
      case 'GOVERNMENT_ADMIN':
        return '/admin/dashboard';
      default:
        return '/user/dashboard';
    }
  };

  return (
    <Routes>
      {/* ------------------------------------------------------------- */}
      {/* Public Routes (Accessible only when NOT logged in or active)   */}
      {/* ------------------------------------------------------------- */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* Authenticated Status Pages (Pending, Suspended, Forbidden)     */}
      {/* ------------------------------------------------------------- */}
      <Route element={<ProtectedRoute />}>
        <Route path="/pending" element={<AccountPendingPage />} />
        <Route path="/suspended" element={<AccountSuspendedPage />} />
        <Route path="/rejected" element={<AccountRejectedPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Profile Page (Accessible to all authenticated users) */}
        <Route element={<RoleLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* ----------------------------------------------------------- */}
        {/* Tier 1: Citizen (USER) Protected Routes                      */}
        {/* ----------------------------------------------------------- */}
        <Route element={<RoleProtectedRoute allowedRoles={['USER']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/lots" element={<MyLotsPage />} />
            <Route path="/user/lots/create" element={<CreateLotPage />} />
            <Route path="/user/lots/:lotId" element={<LotDetailPage />} />
            <Route path="/user/*" element={<UserDashboard />} />
          </Route>
        </Route>


        {/* ----------------------------------------------------------- */}
        {/* Tier 2: Informal Aggregator Protected Routes                 */}
        {/* ----------------------------------------------------------- */}
        <Route element={<RoleProtectedRoute allowedRoles={['INFORMAL_AGGREGATOR']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/aggregator/dashboard" element={<AggregatorDashboard />} />
            <Route path="/aggregator/*" element={<AggregatorDashboard />} />
          </Route>
        </Route>

        {/* ----------------------------------------------------------- */}
        {/* Tier 3: Collection Collector Protected Routes                */}
        {/* ----------------------------------------------------------- */}
        <Route element={<RoleProtectedRoute allowedRoles={['COLLECTION_COLLECTOR']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/collector/dashboard" element={<CollectorDashboard />} />
            <Route path="/collector/*" element={<CollectorDashboard />} />
          </Route>
        </Route>

        {/* ----------------------------------------------------------- */}
        {/* Tier 4: Authorized Recycler Protected Routes                 */}
        {/* ----------------------------------------------------------- */}
        <Route element={<RoleProtectedRoute allowedRoles={['AUTHORIZED_RECYCLER']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/recycler/dashboard" element={<RecyclerDashboard />} />
            <Route path="/recycler/*" element={<RecyclerDashboard />} />
          </Route>
        </Route>

        {/* ----------------------------------------------------------- */}
        {/* Tier 5: Government Regulatory Admin Protected Routes         */}
        {/* ----------------------------------------------------------- */}
        <Route element={<RoleProtectedRoute allowedRoles={['GOVERNMENT_ADMIN']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* ------------------------------------------------------------- */}
      {/* Root & Wildcard Fallback                                       */}
      {/* ------------------------------------------------------------- */}
      <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
};
