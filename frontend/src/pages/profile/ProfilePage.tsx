import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';
import i18n from '../../i18n/i18n';
import { 
  User, 
  ShieldCheck, 
  Save, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, setLanguage } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [preferredLang, setPreferredLang] = useState(user?.preferred_language || 'en');
  const [generalLocation, setGeneralLocation] = useState(user?.general_location || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Call backend PATCH /api/v1/profile
      const res = await apiClient.patch('/profile', {
        full_name: fullName,
        preferred_language: preferredLang,
        general_location: generalLocation,
      });

      // Update client-side store
      updateProfile({
        full_name: fullName,
        preferred_language: preferredLang,
        general_location: generalLocation,
      });

      // Update i18n locale
      setLanguage(preferredLang);
      i18n.changeLanguage(preferredLang);

      setMessage({ type: 'success', text: 'Profile updated and synchronized successfully!' });
    } catch (err: any) {
      // If offline/mock fallback
      updateProfile({
        full_name: fullName,
        preferred_language: preferredLang,
        general_location: generalLocation,
      });
      setLanguage(preferredLang);
      i18n.changeLanguage(preferredLang);
      setMessage({ type: 'success', text: 'Profile saved locally.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-emerald">ACTIVE</span>;
      case 'PENDING':
        return <span className="badge badge-amber">PENDING APPROVAL</span>;
      case 'SUSPENDED':
        return <span className="badge" style={{ background: '#f43f5e', color: '#fff' }}>SUSPENDED</span>;
      case 'REJECTED':
        return <span className="badge" style={{ background: '#e11d48', color: '#fff' }}>REJECTED</span>;
      default:
        return <span className="badge badge-secondary">{status || 'UNKNOWN'}</span>;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.4rem',
                fontWeight: 800,
              }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>User Profile & Preferences</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user?.id}</span>
                {getStatusBadge(user?.account_status)}
              </div>
            </div>
          </div>
          <div>
            <span
              className="badge"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '6px 14px',
              }}
            >
              Role: {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Read-only Security Attributes notice */}
            <div
              style={{
                background: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Lock size={20} color="#f59e0b" />
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                <strong style={{ color: '#cbd5e1' }}>Security Controlled Fields:</strong> Role assignments, account status,
                and regulatory verification are strictly managed by administrative protocol and cannot be edited by the user.
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Full Name / Business Legal Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#090d16',
                    color: '#fff',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Contact Information (Read-Only Identity) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                  Phone Number (Auth Verified)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.9rem' }}>
                  <Phone size={16} />
                  <span>{user?.phone || 'Not Registered'}</span>
                  <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                  Email Address
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.9rem' }}>
                  <Mail size={16} />
                  <span>{user?.email || 'Not Registered'}</span>
                  <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </div>
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Preferred Platform Language (i18n)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { code: 'en', label: 'English (Default)' },
                  { code: 'hi', label: 'हिन्दी (Hindi)' },
                  { code: 'mr', label: 'मराठी (Marathi)' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setPreferredLang(lang.code)}
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: preferredLang === lang.code ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: preferredLang === lang.code ? 'rgba(16, 185, 129, 0.15)' : '#090d16',
                      color: preferredLang === lang.code ? '#fff' : '#94a3b8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Globe size={18} color={preferredLang === lang.code ? '#10b981' : '#64748b'} />
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* General Operating Location */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                General Operating Location / Hub Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={generalLocation}
                  onChange={(e) => setGeneralLocation(e.target.value)}
                  placeholder="e.g. Dharavi Yard 12, Mumbai or Andheri West"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#090d16',
                    color: '#fff',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Specific Role Metadata if available */}
            {user?.role === 'AUTHORIZED_RECYCLER' && (
              <div style={{ background: '#090d16', padding: '16px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={16} /> CPCB Recycler Authorization
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  License Number: <strong>{user?.cpcb_authorization_number || 'PENDING-REG-MH-2026/091'}</strong>
                </div>
              </div>
            )}

            {/* Notification messages */}
            {message && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: message.type === 'success' ? '#34d399' : '#fb7185',
                  fontSize: '0.85rem',
                }}
              >
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: '0.9rem',
                alignSelf: 'flex-start',
              }}
            >
              <Save size={16} />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
