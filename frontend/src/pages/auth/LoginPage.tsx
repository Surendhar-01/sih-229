import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { Phone, Mail, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('+919876543210');
  const [otpOrPass, setOtpOrPass] = useState('123456');
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      email: loginMethod === 'email' ? identifier : `user_${Date.now().toString().slice(-4)}@ewaste.in`,
      phone: loginMethod === 'phone' ? identifier : '+919876543210',
      full_name: `Verified ${selectedRole.replace('_', ' ')}`,
      role: selectedRole,
      preferred_language: 'en',
      is_verified: true,
    };
    const token = `dev-mock-${selectedRole.toLowerCase()}`;
    setAuth(mockUser, token);

    // Redirect to the role-specific route
    redirectToDashboard(selectedRole);
  };

  const redirectToDashboard = (role: UserRole) => {
    if (role === 'USER') navigate('/user/dashboard');
    else if (role === 'INFORMAL_AGGREGATOR') navigate('/aggregator/dashboard');
    else if (role === 'COLLECTION_COLLECTOR') navigate('/collector/dashboard');
    else if (role === 'AUTHORIZED_RECYCLER') navigate('/recycler/dashboard');
    else if (role === 'GOVERNMENT_ADMIN') navigate('/admin/dashboard');
  };

  const quickLoginAs = (role: UserRole) => {
    const mockUser = {
      id: `usr-${role.toLowerCase()}-001`,
      email: `${role.toLowerCase()}@ewaste.gov.in`,
      phone: '+919876543210',
      full_name: `Dev ${role.replace('_', ' ')}`,
      role,
      preferred_language: 'en',
      is_verified: true,
    };
    setAuth(mockUser, `dev-mock-${role.toLowerCase()}`);
    redirectToDashboard(role);
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign In</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Access your e-waste circular management dashboard
        </p>
      </div>

      {/* Quick Role Fast-Logins (Development Accelerator) */}
      <div style={{ marginBottom: 24, padding: '12px', background: '#090d16', borderRadius: 10, border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, textTransform: 'uppercase' }}>
          <Zap size={14} /> Quick One-Click Dev Sign-In
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          <button type="button" onClick={() => quickLoginAs('USER')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
            Citizen
          </button>
          <button type="button" onClick={() => quickLoginAs('INFORMAL_AGGREGATOR')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
            Aggregator
          </button>
          <button type="button" onClick={() => quickLoginAs('COLLECTION_COLLECTOR')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
            Collector
          </button>
          <button type="button" onClick={() => quickLoginAs('AUTHORIZED_RECYCLER')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
            Recycler
          </button>
        </div>
        <button type="button" onClick={() => quickLoginAs('GOVERNMENT_ADMIN')} className="btn-secondary" style={{ width: '100%', marginTop: 6, padding: '6px 8px', fontSize: '0.75rem', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}>
          Government Admin Command Center
        </button>
      </div>

      {/* Role Selection Dropdown */}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>
            Select Stakeholder Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#1e293b', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
          >
            <option value="USER">Citizen / Household Consumer</option>
            <option value="INFORMAL_AGGREGATOR">Informal Aggregator (Scrap Godown)</option>
            <option value="COLLECTION_COLLECTOR">Collection Collector / Kabadiwala</option>
            <option value="AUTHORIZED_RECYCLER">Authorized Recycler (CPCB Registered)</option>
            <option value="GOVERNMENT_ADMIN">Government Admin (CPCB / SPCB)</option>
          </select>
        </div>

        {/* Auth Mode Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 6,
              border: 'none',
              background: loginMethod === 'phone' ? '#10b981' : '#1e293b',
              color: '#fff',
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
              background: loginMethod === 'email' ? '#10b981' : '#1e293b',
              color: '#fff',
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
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>
            {loginMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
          </label>
          <input
            type={loginMethod === 'phone' ? 'tel' : 'email'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#090d16', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>
            {loginMethod === 'phone' ? '6-Digit OTP Code' : 'Password'}
          </label>
          <input
            type="password"
            value={otpOrPass}
            onChange={(e) => setOtpOrPass(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#090d16', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          <span>Authenticate & Continue</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
          Register Role Profile
        </Link>
      </div>
    </div>
  );
};
