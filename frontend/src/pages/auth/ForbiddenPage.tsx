import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

interface ForbiddenPageProps {
  requiredRoles?: UserRole[];
  userRole?: UserRole;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ requiredRoles, userRole }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const getPermittedDashboard = (role?: UserRole) => {
    switch (role) {
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

  const handleGoToPermitted = () => {
    navigate(getPermittedDashboard(userRole || user?.role));
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: 540,
          width: '100%',
          padding: '36px',
          textAlign: 'center',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          background: 'rgba(15, 23, 42, 0.95)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#fb7185',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <span
          className="badge"
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fb7185',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            marginBottom: 12,
          }}
        >
          403 Access Denied
        </span>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Unauthorized Role Access
        </h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
          Your current account role <strong style={{ color: '#0369a1' }}>{userRole || user?.role || 'GUEST'}</strong> does
          not possess permission to access this protected sector. In compliance with CPCB E-Waste Security Directives, access is
          strictly restricted.
        </p>

        {requiredRoles && requiredRoles.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: '0.8rem',
              color: '#475569',
              marginBottom: 24,
              border: '1px solid var(--border-color)',
            }}
          >
            Required Role: <span style={{ color: '#fb7185', fontWeight: 700 }}>{requiredRoles.join(' or ')}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleGoToPermitted}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <Home size={16} />
            <span>Go to My Permitted Dashboard</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Switch Account / Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
