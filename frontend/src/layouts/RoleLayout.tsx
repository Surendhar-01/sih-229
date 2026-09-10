import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { checkBackendHealth } from '../services/api';
import { 
  Recycle, 
  UserCheck, 
  LogOut, 
  Activity, 
  Languages, 
  ShieldCheck, 
  Truck, 
  Building2, 
  Factory, 
  Landmark 
} from 'lucide-react';
import i18n from '../i18n/i18n';

export const RoleLayout: React.FC = () => {
  const { user, logout, language, setLanguage } = useAuthStore();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [isHealthy, setIsHealthy] = useState<boolean>(false);

  useEffect(() => {
    const fetchHealth = async () => {
      const data = await checkBackendHealth();
      if (data.status === 'ok') {
        setIsHealthy(true);
        const aiStatus = data.services?.ai_service?.status === 'UP' ? 'AI UP' : 'AI STANDBY';
        setHealthStatus(`API Gateway UP • ${aiStatus}`);
      } else {
        setIsHealthy(false);
        setHealthStatus('API Gateway Standby');
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'INFORMAL_AGGREGATOR': return <Building2 size={16} className="text-amber-400" />;
      case 'COLLECTION_COLLECTOR': return <Truck size={16} className="text-cyan-400" />;
      case 'AUTHORIZED_RECYCLER': return <Factory size={16} className="text-emerald-400" />;
      case 'GOVERNMENT_ADMIN': return <Landmark size={16} className="text-rose-400" />;
      default: return <UserCheck size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: '#ffffff',
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '10px 20px',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Recycle size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>ECOBRIDGES</span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>DPI</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>National Circular Economy Platform</div>
            </div>
          </Link>

          {/* Role & Switcher Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Authenticated user identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              {getRoleIcon(user?.role)}
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.full_name || 'Authenticated User'}</span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>{user?.role || 'USER'} · {user?.account_status || 'ACTIVE'}</span>
              </div>
            </div>

            {/* Language Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f8fafc', padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
              <Languages size={13} color="#475569" />
              {['en', 'hi', 'mr'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  style={{
                    background: language === lang ? '#10b981' : 'transparent',
                    color: language === lang ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* System Connection Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: isHealthy ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)', padding: '5px 10px', borderRadius: 20, border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}` }}>
              <Activity size={13} color={isHealthy ? '#047857' : '#e11d48'} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isHealthy ? '#047857' : '#e11d48' }}>
                {healthStatus}
              </span>
            </div>

            {/* User Profile & Account Status Badge */}
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#f8fafc',
                padding: '5px 10px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
              }}
            >
              <UserCheck size={14} color="#10b981" />
              <span style={{ fontWeight: 600 }}>{user?.full_name?.split(' ')[0] || 'Profile'}</span>
              <span
                className="badge"
                style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  background: user?.account_status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: user?.account_status === 'ACTIVE' ? '#047857' : '#b45309',
                  border: 'none',
                }}
              >
                {user?.account_status || 'ACTIVE'}
              </span>
            </Link>

            {/* Logout button */}
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: '#475569',
                padding: '5px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Outlet for Role Dashboards */}
      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 16px' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Compliant with CPCB E-Waste (Management) Rules 2022 • Extended Producer Responsibility (EPR) DPI</span>
        </div>
      </footer>
    </div>
  );
};
