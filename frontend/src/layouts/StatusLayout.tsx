import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';

export const StatusLayout: React.FC = () => <div className="platform-page"><AppHeader showAccount /><Outlet /></div>;
