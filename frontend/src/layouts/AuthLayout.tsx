import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';

export const AuthLayout: React.FC = () => (
  <div className="platform-page">
    <AppHeader />
    <main style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 76px)' }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="glass-panel"><Outlet /></div>
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, color: '#547061', fontSize: '.8rem' }}><ShieldCheck size={15} color="#176b44" />Secure e-waste platform access</div>
    </main>
  </div>
);
