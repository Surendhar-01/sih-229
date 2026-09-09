import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { checkBackendHealth } from '../services/api';
import { UserRole } from '../types';
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
  const { user, logout, switchRole, language, setLanguage } = useAuthStore();
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

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    switchRole(newRole);
    if (newRole === 'USER') navigate('/user/dashboard');
    if (newRole === 'INFORMAL_AGGREGATOR') navigate('/aggregator/dashboard');
    if (newRole === 'COLLECTION_COLLECTOR') navigate('/collector/dashboard');
    if (newRole === 'AUTHORIZED_RECYCLER') navigate('/recycler/dashboard');
    if (newRole === 'GOVERNMENT_ADMIN') navigate('/admin/dashboard');
  };

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
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '12px 24px',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Recycle size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>India E-Waste</span>
                <span className="badge badge-emerald">DPI</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>National Circular Economy Platform</div>
            </div>
          </Link>

          {/* Role & Switcher Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Quick Role Switcher for Dev Testing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              {getRoleIcon(user?.role)}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Role:</span>
              <select
                value={user?.role || 'USER'}
                onChange={handleRoleChange}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="USER" style={{ background: '#1e293b' }}>USER (Citizen)</option>
                <option value="INFORMAL_AGGREGATOR" style={{ background: '#1e293b' }}>INFORMAL AGGREGATOR</option>
                <option value="COLLECTION_COLLECTOR" style={{ background: '#1e293b' }}>COLLECTION COLLECTOR</option>
                <option value="AUTHORIZED_RECYCLER" style={{ background: '#1e293b' }}>AUTHORIZED RECYCLER</option>
                <option value="GOVERNMENT_ADMIN" style={{ background: '#1e293b' }}>GOVERNMENT ADMIN</option>
              </select>
            </div>

            {/* Language Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1e293b', padding: '4px 8px', borderRadius: 6 }}>
              <Languages size={14} color="#94a3b8" />
              {['en', 'hi', 'mr'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  style={{
                    background: language === lang ? '#10b981' : 'transparent',
                    color: language === lang ? '#fff' : '#94a3b8',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: '0.75rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', padding: '6px 12px', borderRadius: 20, border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}` }}>
              <Activity size={14} color={isHealthy ? '#34d399' : '#fb7185'} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isHealthy ? '#34d399' : '#fb7185' }}>
                {healthStatus}
              </span>
            </div>

            {/* User Profile & Account Status Badge */}
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#1e293b',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                color: '#fff',
                fontSize: '0.8rem',
              }}
            >
              <UserCheck size={14} color="#10b981" />
              <span style={{ fontWeight: 600 }}>{user?.full_name?.split(' ')[0] || 'Profile'}</span>
              <span
                className="badge"
                style={{
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  background: user?.account_status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: user?.account_status === 'ACTIVE' ? '#34d399' : '#f59e0b',
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
                navigate('/login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: '#94a3b8',
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              <LogOut size={14} />
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
