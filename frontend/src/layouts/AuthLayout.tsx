import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Recycle, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Recycle size={26} color="var(--text-primary)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>ECOBRIDGES</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Formalized Scrap & Circular Recovery Platform</p>
          </div>
        </Link>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }} className="glass-panel">
        <Outlet />
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.8rem' }}>
        <ShieldCheck size={14} color="#10b981" />
        <span>Secured via Supabase Auth & Role-Based Access Control</span>
      </div>
    </div>
  );
};
