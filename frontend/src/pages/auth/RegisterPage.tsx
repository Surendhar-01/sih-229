import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { UserPlus, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      email: `${fullName.toLowerCase().replace(/\s+/g, '')}@ewaste.in`,
      phone,
      full_name: fullName || 'New Registered User',
      role: selectedRole,
      preferred_language: 'en',
      is_verified: true,
    };
    const token = `dev-mock-${selectedRole.toLowerCase()}`;
    setAuth(newUser, token);

    if (selectedRole === 'USER') navigate('/user/dashboard');
    else if (selectedRole === 'INFORMAL_AGGREGATOR') navigate('/aggregator/dashboard');
    else if (selectedRole === 'COLLECTION_COLLECTOR') navigate('/collector/dashboard');
    else if (selectedRole === 'AUTHORIZED_RECYCLER') navigate('/recycler/dashboard');
    else if (selectedRole === 'GOVERNMENT_ADMIN') navigate('/admin/dashboard');
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Account</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Register your role in the National E-Waste Circular Network
        </p>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>
            Full Name / Enterprise Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g. Ramesh Babu or Dharavi Scrap Hub"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#090d16', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>
            Mobile Number (for OTP & Payouts)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+91 9876543210"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#090d16', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#cbd5e1' }}>
            Primary Platform Role
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

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          <UserPlus size={16} />
          <span>Register & Enter Dashboard</span>
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
          Sign In
        </Link>
      </div>
    </div>
  );
};
