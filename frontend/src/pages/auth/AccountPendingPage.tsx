import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2, FileText, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AccountPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, logout } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRefresh = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      await refreshProfile();
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser?.account_status === 'ACTIVE') {
        setFeedback('Account approved! Redirecting to operational dashboard...');
        setTimeout(() => {
          switch (updatedUser.role) {
            case 'INFORMAL_AGGREGATOR':
              navigate('/aggregator/dashboard');
              break;
            case 'COLLECTION_COLLECTOR':
              navigate('/collector/dashboard');
              break;
            case 'AUTHORIZED_RECYCLER':
              navigate('/recycler/dashboard');
              break;
            case 'GOVERNMENT_ADMIN':
              navigate('/admin/dashboard');
              break;
            default:
              navigate('/user/dashboard');
          }
        }, 1200);
      } else {
        setFeedback('Your account application is still pending regulatory review.');
      }
    } catch {
      setFeedback('Unable to reach server. Please try again shortly.');
    } finally {
      setChecking(false);
    }
  };

  const getRoleWorkflow = () => {
    switch (user?.role) {
      case 'COLLECTION_COLLECTOR':
        return {
          title: 'Field Collector Registration Review',
          description:
            'Your field collection runner profile and operational zone are undergoing validation by the designated regional aggregator or municipal administrator.',
          steps: ['ID Verification', 'Operational Zone Allocation', 'Aggregator Confirmation', 'Active Account'],
        };
      case 'INFORMAL_AGGREGATOR':
        return {
          title: 'Informal Aggregator Yard Verification',
          description:
            'Your scrap consolidation facility details, fire safety readiness, and storage capacity are undergoing regulatory scrutiny by the SPCB/CPCB authority.',
          steps: ['Facility Registration', 'Environmental Audit', 'Admin Approval', 'DPI Yard Onboarding'],
        };
      case 'AUTHORIZED_RECYCLER':
        return {
          title: 'CPCB Recycler Authorization Audit',
          description:
            'Your facility authorization number and hazardous material handling credentials are being cross-verified against the CPCB Central EPR Database.',
          steps: ['Authorization Submitted', 'CPCB License Match', 'State PCB Validation', 'Full B2B Access'],
        };
      default:
        return {
          title: 'Account Verification Pending',
          description: 'Your registration request is currently under review by the platform administrator.',
          steps: ['Request Submitted', 'Administrative Review', 'Approved'],
        };
    }
  };

  const workflow = getRoleWorkflow();

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
          maxWidth: 620,
          width: '100%',
          padding: '40px',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 20px 45px -18px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Top Status Icon */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#fffbeb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              marginBottom: 16,
            }}
          >
            <Clock size={40} />
          </div>

          <div style={{ display: 'inline-block' }}>
            <span
              className="badge"
              style={{
                background: '#fffbeb',
                color: '#f59e0b',
                border: '1px solid #fcd34d',
                fontSize: '0.8rem',
                padding: '4px 12px',
              }}
            >
              STATUS: PENDING VERIFICATION
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 12 }}>
            {workflow.title}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: 8, lineHeight: 1.6 }}>
            {workflow.description}
          </p>
        </div>

        {/* Account Details Box */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 24,
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Applicant Name:</span>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.full_name || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Requested Role:</span>
              <div style={{ color: '#0369a1', fontWeight: 700 }}>{user?.role?.replace('_', ' ') || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Contact Details:</span>
              <div style={{ color: '#334155' }}>{user?.phone || user?.email || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Operating Area:</span>
              <div style={{ color: '#334155' }}>{user?.general_location || 'Not Specified'}</div>
            </div>
          </div>
        </div>

        {/* Stepper Progression */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>
            Approval Progression
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {workflow.steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: idx === 0 ? '#ecfdf5' : idx === 1 ? '#fffbeb' : '#f8fafc',
                  borderTop: `1px solid ${idx === 0 ? '#a7f3d0' : idx === 1 ? '#fde68a' : '#e2e8f0'}`,
                  borderRight: `1px solid ${idx === 0 ? '#a7f3d0' : idx === 1 ? '#fde68a' : '#e2e8f0'}`,
                  borderBottom: `1px solid ${idx === 0 ? '#a7f3d0' : idx === 1 ? '#fde68a' : '#e2e8f0'}`,
                  borderLeft: `3px solid ${idx === 0 ? '#10b981' : idx === 1 ? '#f59e0b' : '#94a3b8'}`,
                }}
              >
                {idx === 0 ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : (
                  <Clock size={16} color={idx === 1 ? '#f59e0b' : '#64748b'} />
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: idx <= 1 ? 'var(--text-primary)' : '#64748b' }}>
                  {step} {idx === 1 && '(Currently In Review)'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {feedback && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: feedback.includes('approved') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: feedback.includes('approved') ? '#047857' : '#f59e0b',
              fontSize: '0.85rem',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            {feedback}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="btn-primary"
            style={{ flex: 1, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="btn-secondary"
            style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
