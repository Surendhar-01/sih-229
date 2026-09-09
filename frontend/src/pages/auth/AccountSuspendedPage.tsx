import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, AlertTriangle, LogOut, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AccountSuspendedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0e17',
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
          borderRadius: 16,
          border: '1px solid rgba(244, 63, 94, 0.5)',
          background: 'rgba(15, 23, 42, 0.96)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fb7185',
            marginBottom: 16,
          }}
        >
          <ShieldX size={36} />
        </div>

        <div>
          <span
            className="badge"
            style={{
              background: 'rgba(244, 63, 94, 0.2)',
              color: '#fb7185',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              fontSize: '0.8rem',
            }}
          >
            ACCOUNT STATUS: SUSPENDED
          </span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: 12 }}>
          Account Operations Suspended
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: 10, lineHeight: 1.6 }}>
          Operations for <strong style={{ color: '#fff' }}>{user?.full_name}</strong> have been temporarily restricted by
          the regulatory oversight authority due to an administrative or environmental compliance audit under the CPCB E-Waste
          Rules 2022.
        </p>

        {user?.approval_notes && (
          <div
            style={{
              marginTop: 16,
              padding: '12px',
              background: '#090d16',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              color: '#fb7185',
              fontSize: '0.85rem',
            }}
          >
            Audit Reason: {user.approval_notes}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="mailto:compliance@cpcb-ewaste.gov.in"
            className="btn-primary"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '0.85rem',
            }}
          >
            <Mail size={16} />
            <span>Contact Regulatory Support</span>
          </a>

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
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
