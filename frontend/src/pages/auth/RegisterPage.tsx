import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { apiClient } from '../../services/api';
import { 
  UserPlus, 
  ArrowRight, 
  ShieldAlert, 
  Building2, 
  Truck, 
  Factory, 
  UserCheck, 
  Globe, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    (location.state as { selectedRole?: UserRole } | null)?.selectedRole || 'USER',
  );
  const [preferredLang, setPreferredLang] = useState('en');
  const [generalLocation, setGeneralLocation] = useState('');
  const [cpcbNumber, setCpcbNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('ELECTRIC_3WHEELER');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleLabels: Record<UserRole, string> = {
    USER: 'Citizen / Household Consumer',
    INFORMAL_AGGREGATOR: 'Informal Scrap Aggregator',
    COLLECTION_COLLECTOR: 'Field Collector / Kabadiwala',
    AUTHORIZED_RECYCLER: 'CPCB Authorized Recycler',
    GOVERNMENT_ADMIN: 'CPCB / SPCB Regulatory Admin',
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Strict validation: Government Admin CANNOT register via public form
    if (selectedRole === 'GOVERNMENT_ADMIN') {
      setErrorMessage('Government Administrator accounts cannot be self-registered. Internal regulatory credentials required.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/register', {
        email, password, phone, full_name: fullName, role: selectedRole,
        preferred_language: preferredLang, general_location: generalLocation,
        vehicle_type: selectedRole === 'COLLECTION_COLLECTOR' ? vehicleType : undefined,
        cpcb_authorization_number: selectedRole === 'AUTHORIZED_RECYCLER' ? cpcbNumber : undefined,
      });
      const authResult = response.data || response;
      const registeredUser: any = authResult.profile;
      const accessToken = authResult.session?.access_token;

      // Set auth state
      if (accessToken) setAuth(registeredUser, accessToken);

      // Route based on account status & role
      if (registeredUser.account_status === 'ACTIVE') {
        navigate('/user/dashboard');
      } else {
        // Professional roles in PENDING state go to pending explanation page
        navigate('/pending');
      }
    } catch (err: any) {
      const message = err?.message || 'Registration failed. Please check your credentials.';
      setErrorMessage(message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already been registered')
        ? 'This email is already registered. Please use the Sign In link below.'
        : message.toLowerCase().includes('failed to fetch')
        ? 'Unable to reach Supabase. Restart the frontend after checking VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.'
        : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Platform Account</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Register your entity into the National E-Waste Circular Economy Network
        </p>
      </div>

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
        <span>Registering as: {roleLabels[selectedRole]}</span>
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

      <form onSubmit={handleRegister}>
        {/* Role Selector Cards */}
        <div style={{ display: 'none', marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: '#334155' }}>
            Select Stakeholder Category
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { role: 'USER' as UserRole, label: 'Citizen / Household', icon: <UserCheck size={16} />, activeColor: '#10b981' },
              { role: 'COLLECTION_COLLECTOR' as UserRole, label: 'Collection Collector', icon: <Truck size={16} />, activeColor: '#0369a1' },
              { role: 'INFORMAL_AGGREGATOR' as UserRole, label: 'Informal Aggregator', icon: <Building2 size={16} />, activeColor: '#f59e0b' },
              { role: 'AUTHORIZED_RECYCLER' as UserRole, label: 'Authorized Recycler', icon: <Factory size={16} />, activeColor: '#7e22ce' },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => setSelectedRole(item.role)}
                style={{
                  minHeight: 52,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: selectedRole === item.role ? `2px solid ${item.activeColor}` : '1px solid var(--border-color)',
                  background: selectedRole === item.role ? 'rgba(255, 255, 255, 0.92)' : '#ffffff',
                  color: selectedRole === item.role ? 'var(--text-primary)' : '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'left',
                }}
              >
                <div style={{ color: item.activeColor }}>{item.icon}</div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Role Status Note */}
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 6,
              background: selectedRole === 'USER' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${selectedRole === 'USER' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontSize: '0.75rem',
              color: selectedRole === 'USER' ? '#047857' : '#f59e0b',
            }}
          >
            {selectedRole === 'USER'
              ? '✓ Immediate Active Access: Citizen accounts can instantly schedule doorstep pickups.'
              : '⏳ Regulatory Review Required: Professional accounts are created in PENDING status until approved by regulatory authorities.'}
          </div>
        </div>

        {/* Full Name / Legal Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
            Full Name / Enterprise Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g. Anita Sharma or Dharavi Scrap Hub"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        {/* Phone & Email Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
              Mobile Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+91 9876543210"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
            Account Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••••••"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>

        {/* Preferred Language & Operating Location */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
              Preferred Language
            </label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
              General Operating Area
            </label>
            <input
              type="text"
              value={generalLocation}
              onChange={(e) => setGeneralLocation(e.target.value)}
              required
              placeholder="e.g. Andheri West, Mumbai"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
        </div>

        {/* Dynamic Fields for Professional Roles */}
        {selectedRole === 'COLLECTION_COLLECTOR' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#0369a1' }}>
              Collection Transport Type
            </label>
            <input
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              required
              placeholder="e.g. Electric 3-Wheeler, Mini Truck, Hand Cart"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
        )}

        {selectedRole === 'AUTHORIZED_RECYCLER' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#7e22ce' }}>
              CPCB / SPCB Authorization License Number
            </label>
            <input
              type="text"
              value={cpcbNumber}
              onChange={(e) => setCpcbNumber(e.target.value)}
              required
              placeholder="e.g. CPCB-EPR-REG-MH-2026/0014"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: 8, padding: '12px' }}
        >
          <UserPlus size={16} />
          <span>{loading ? 'Submitting Application...' : 'Register Platform Account'}</span>
        </button>
      </form>

      {/* Footer Security Notice */}
      <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
          Sign In
        </Link>
      </div>
    </div>
  );
};
