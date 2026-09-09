import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AccountRejectedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
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
          <XCircle size={36} />
        </div>

        <span
          className="badge"
          style={{
            background: 'rgba(244, 63, 94, 0.2)',
            color: '#fb7185',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            fontSize: '0.8rem',
          }}
        >
          STATUS: REJECTED
        </span>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 12 }}>
          Registration Application Declined
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
          Your application for the role <strong style={{ color: 'var(--text-primary)' }}>{user?.role?.replace('_', ' ')}</strong> could
          not be approved by the regulatory authority.
        </p>

        {user?.approval_notes && (
          <div
            style={{
              marginTop: 16,
              padding: '12px',
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              color: '#fb7185',
              fontSize: '0.85rem',
            }}
          >
            Review Remark: {user.approval_notes}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/register');
            }}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            <span>Apply with Correct Details</span>
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
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
