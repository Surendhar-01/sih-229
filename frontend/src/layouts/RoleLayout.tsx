import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';

export const RoleLayout: React.FC = () => (
  <div className="platform-page">
    <AppHeader showAccount />
    <main><Outlet /></main>
  </div>
);
