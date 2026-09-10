import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole, UserProfile } from '../../types';
import { apiClient } from '../../services/api';
import { 
  Phone, 
  Mail, 
  ArrowRight, 
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  UserCheck
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('email');
  const selectedRole = ((location.state as { selectedRole?: UserRole } | null)?.selectedRole || 'USER');
  const defaultCredentials: Record<UserRole, { email: string; password: string }> = {
    USER: { email: import.meta.env.VITE_DEMO_USER_EMAIL || '', password: import.meta.env.VITE_DEMO_USER_PASSWORD || '' },
    INFORMAL_AGGREGATOR: { email: import.meta.env.VITE_DEMO_AGGREGATOR_EMAIL || '', password: import.meta.env.VITE_DEMO_AGGREGATOR_PASSWORD || '' },
    COLLECTION_COLLECTOR: { email: import.meta.env.VITE_DEMO_COLLECTOR_EMAIL || '', password: import.meta.env.VITE_DEMO_COLLECTOR_PASSWORD || '' },
    AUTHORIZED_RECYCLER: { email: import.meta.env.VITE_DEMO_RECYCLER_EMAIL || '', password: import.meta.env.VITE_DEMO_RECYCLER_PASSWORD || '' },
    GOVERNMENT_ADMIN: { email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || '', password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '' },
  };
  const [identifier, setIdentifier] = useState(defaultCredentials[selectedRole].email);
  const [otpOrPass, setOtpOrPass] = useState(defaultCredentials[selectedRole].password);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const routeUserByStatusAndRole = (user: UserProfile) => {
    if (user.account_status === 'PENDING') {
      navigate('/pending');
      return;
    }
    if (user.account_status === 'SUSPENDED' || user.account_status === 'DEACTIVATED') {
      navigate('/suspended');
      return;
    }
    if (user.account_status === 'REJECTED') {
      navigate('/rejected');
      return;
    }

    // Role redirect for ACTIVE accounts
    switch (user.role) {
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
        break;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post('/auth/login', { identifier, password: otpOrPass, role: selectedRole });
      const authResult = response.data || response;
      const token = authResult.session.access_token;
      const userProfile: UserProfile = authResult.profile;

      setAuth(userProfile, token);
      routeUserByStatusAndRole(userProfile);
    } catch (err: any) {
      const message = err?.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(message.toLowerCase().includes('failed to fetch')
        ? 'Unable to reach the authentication service. Check that the backend is running, then try again.'
        : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
          <span>← Back to Platform Intro</span>
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Platform Sign In</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Access your e-waste circular management dashboard
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: 16,
            border: '1px solid rgba(244, 63, 94, 0.3)',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          marginBottom: 18,
          borderRadius: 8,
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#047857',
          fontSize: '0.85rem',
          fontWeight: 700,
        }}
      >
        <UserCheck size={17} />
        <span>Signing in as: {selectedRole.replace(/_/g, ' ')}</span>
      </div>

      {/* Standard Form Login */}
      <form onSubmit={handleLogin}>
        <div style={{ display: 'none', marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
            Target Platform Role
          </label>
          <select
            defaultValue={selectedRole}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#f1f5f9', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
          >
            <option value="USER">Citizen / Household Consumer</option>
            <option value="INFORMAL_AGGREGATOR">Informal Aggregator (Scrap Yard Hub)</option>
            <option value="COLLECTION_COLLECTOR">Collection Collector / Kabadiwala Runner</option>
            <option value="AUTHORIZED_RECYCLER">Authorized Recycler (CPCB Registered)</option>
            <option value="GOVERNMENT_ADMIN">Government Admin (CPCB / SPCB Authority)</option>
          </select>
        </div>

        {/* Auth Mode Toggle */}
        <div style={{ display: 'none', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 6,
              border: 'none',
              background: loginMethod === 'phone' ? '#10b981' : '#f1f5f9',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Phone size={14} /> Phone OTP
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 6,
              border: 'none',
              background: loginMethod === 'email' ? '#10b981' : '#f1f5f9',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Mail size={14} /> Email
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
            {loginMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
          </label>
          <input
            type={loginMethod === 'phone' ? 'tel' : 'email'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
            {loginMethod === 'phone' ? '6-Digit OTP Code' : 'Password'}
          </label>
          <input
            type="password"
            value={otpOrPass}
            onChange={(e) => setOtpOrPass(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
          <span>{loading ? 'Verifying Identity...' : 'Authenticate & Continue'}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/register" state={{ selectedRole }} style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
          Register Role Profile
        </Link>
      </div>
    </div>
  );
};
