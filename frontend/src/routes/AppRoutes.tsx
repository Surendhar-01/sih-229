import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { RoleLayout } from '../layouts/RoleLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { UserDashboard } from '../pages/dashboards/UserDashboard';
import { AggregatorDashboard } from '../pages/dashboards/AggregatorDashboard';
import { CollectorDashboard } from '../pages/dashboards/CollectorDashboard';
import { RecyclerDashboard } from '../pages/dashboards/RecyclerDashboard';
import { AdminDashboard } from '../pages/dashboards/AdminDashboard';
import { useAuthStore } from '../store/authStore';

export const AppRoutes: React.FC = () => {
  const { user } = useAuthStore();

  const getDefaultRedirect = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'INFORMAL_AGGREGATOR': return '/aggregator/dashboard';
      case 'COLLECTION_COLLECTOR': return '/collector/dashboard';
      case 'AUTHORIZED_RECYCLER': return '/recycler/dashboard';
      case 'GOVERNMENT_ADMIN': return '/admin/dashboard';
      default: return '/user/dashboard';
    }
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Role Protected Layout */}
      <Route element={<RoleLayout />}>
        {/* Citizen Routes */}
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/*" element={<UserDashboard />} />

        {/* Aggregator Routes */}
        <Route path="/aggregator/dashboard" element={<AggregatorDashboard />} />
        <Route path="/aggregator/*" element={<AggregatorDashboard />} />

        {/* Collector Routes */}
        <Route path="/collector/dashboard" element={<CollectorDashboard />} />
        <Route path="/collector/*" element={<CollectorDashboard />} />

        {/* Recycler Routes */}
        <Route path="/recycler/dashboard" element={<RecyclerDashboard />} />
        <Route path="/recycler/*" element={<RecyclerDashboard />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>

      {/* Fallback Root Redirect */}
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
};
