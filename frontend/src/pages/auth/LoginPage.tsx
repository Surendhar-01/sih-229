import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole, UserProfile } from '../../types';
import { apiClient } from '../../services/api';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  UserCheck,
  RefreshCw,
  Volume2,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, language } = useAuthStore();
  const activeLang = language === 'hi' || language === 'mr' ? language : 'en';

  const initialRole = (location.state as { selectedRole?: UserRole } | null)?.selectedRole;
  // Default to Informal Collector if not specified, strictly constrained to 3 roles
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRole && ['COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER', 'GOVERNMENT_ADMIN'].includes(initialRole)
      ? initialRole
      : 'COLLECTION_COLLECTOR'
  );

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');

  // Mobile OTP States
  const defaultPhones: Record<UserRole, string> = {
    COLLECTION_COLLECTOR: '9876543212',
    AUTHORIZED_RECYCLER: '9876543213',
    GOVERNMENT_ADMIN: '9876543214',
    USER: '9876543210',
    INFORMAL_AGGREGATOR: '9876543211',
  };
  const [phone, setPhone] = useState(defaultPhones[selectedRole] || '9876543212');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);

  // Email / Password States
  const defaultEmails: Record<UserRole, { email: string; pass: string }> = {
    COLLECTION_COLLECTOR: { email: 'collector@ewaste.gov.in', pass: 'Collector@2026!' },
    AUTHORIZED_RECYCLER: { email: 'recycler@ewaste.gov.in', pass: 'Recycler@2026!' },
    GOVERNMENT_ADMIN: { email: 'admin@ewaste.gov.in', pass: 'Admin@2026!' },
    USER: { email: 'citizen@ewaste.gov.in', pass: 'Citizen@2026!' },
    INFORMAL_AGGREGATOR: { email: 'aggregator@ewaste.gov.in', pass: 'Aggregator@2026!' },
  };
  const [email, setEmail] = useState(defaultEmails[selectedRole]?.email || '');
  const [password, setPassword] = useState(defaultEmails[selectedRole]?.pass || '');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Spoken TTS feedback for low literacy / vernacular accessibility
  const speakFeedback = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeLang === 'hi' ? 'hi-IN' : activeLang === 'mr' ? 'mr-IN' : 'en-IN';
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Keep defaults updated when role switches
  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    setOtpSent(false);
    setOtp('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setPhone(defaultPhones[newRole] || '9876543212');
    setEmail(defaultEmails[newRole]?.email || '');
    setPassword(defaultEmails[newRole]?.pass || '');
  };

  // Cooldown timer effect
  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Expiry timer effect
  useEffect(() => {
    let interval: any;
    if (otpSent && otpExpiresIn > 0) {
      interval = setInterval(() => setOtpExpiresIn((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpExpiresIn]);

  // Listen for Global Voice Assistant events
  useEffect(() => {
    const handleSwitchMethod = (e: any) => {
      if (e.detail === 'phone') setAuthMethod('phone');
      if (e.detail === 'email') setAuthMethod('email');
    };
    const handleTriggerGoogle = () => void handleGoogleSignIn();
    const handleResendVoice = () => {
      if (otpSent && resendCooldown <= 0) void handleSendOtp();
    };

    window.addEventListener('ewaste:auth_switch_method', handleSwitchMethod);
    window.addEventListener('ewaste:trigger_google_auth', handleTriggerGoogle);
    window.addEventListener('ewaste:resend_otp', handleResendVoice);

    return () => {
      window.removeEventListener('ewaste:auth_switch_method', handleSwitchMethod);
      window.removeEventListener('ewaste:trigger_google_auth', handleTriggerGoogle);
      window.removeEventListener('ewaste:resend_otp', handleResendVoice);
    };
  }, [otpSent, resendCooldown]);

  // Handle Google OAuth Redirect Callback on mount
  useEffect(() => {
    const checkGoogleOAuthSession = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) return;

        // Verify if redirected from Google OAuth
        if (session.user.app_metadata?.provider === 'google' || session.user.email) {
          setLoading(true);
          const syncRes = await apiClient.post('/auth/google/sync', {
            supabase_user_id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Google User',
            role: selectedRole,
          });

          const authResult = syncRes.data?.data || syncRes.data;
          const userProfile: UserProfile = authResult.profile;
          setAuth(userProfile, session.access_token);
          routeUserByStatusAndRole(userProfile);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Google account synchronization failed.');
      } finally {
        setLoading(false);
      }
    };
    void checkGoogleOAuthSession();
  }, [selectedRole]);

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

    // Role redirects for ACTIVE accounts
    switch (user.role) {
      case 'COLLECTION_COLLECTOR':
      case 'INFORMAL_AGGREGATOR':
        navigate('/collector/dashboard');
        break;
      case 'AUTHORIZED_RECYCLER':
        navigate('/recycler/dashboard');
        break;
      case 'GOVERNMENT_ADMIN':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/collector/dashboard');
        break;
    }
  };

  // -------------------------------------------------------------
  // Mobile OTP Request Handler
  // -------------------------------------------------------------
  const handleSendOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
      const res = await apiClient.post('/auth/otp/send', {
        phone: formattedPhone,
        role: selectedRole,
      });

      const data = res.data?.data || res.data;
      setOtpSent(true);
      setResendCooldown(data.cooldown_seconds || 60);
      setOtpExpiresIn(data.expires_in_seconds || 300);
      setSuccessMessage(data.message || 'OTP sent successfully.');
      speakFeedback(
        activeLang === 'hi'
          ? 'आपके मोबाइल पर 6 अंकों का ओटीपी भेजा गया है। कृपया कोड दर्ज करें।'
          : activeLang === 'mr'
            ? 'आपल्या मोबाईलवर 6 अंकी पडताळणी कोड पाठवला आहे. कृपया कोड टाका.'
            : 'A 6-digit verification code has been sent to your mobile phone.'
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP code. Please try again.';
      setErrorMessage(msg);
      speakFeedback(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Mobile OTP Verification Handler
  // -------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
      const res = await apiClient.post('/auth/otp/verify', {
        phone: formattedPhone,
        otp: otp.trim(),
        role: selectedRole,
      });

      const authResult = res.data?.data || res.data;
      const token = authResult.session?.access_token;
      const userProfile: UserProfile = authResult.profile;

      setAuth(userProfile, token);
      speakFeedback(
        activeLang === 'hi'
          ? 'सफलतापूर्वक सत्यापन हुआ। आपका स्वागत है।'
          : activeLang === 'mr'
            ? 'यशस्वी पडताळणी झाली. आपले स्वागत आहे.'
            : 'Authentication successful. Welcome to your dashboard.'
      );
      routeUserByStatusAndRole(userProfile);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed. Please check the code.';
      setErrorMessage(msg);
      speakFeedback(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Email / Password Authentication Handler
  // -------------------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post('/auth/login', {
        identifier: email.trim(),
        password: password.trim(),
        role: selectedRole,
      });

      const authResult = response.data?.data || response.data || response;
      const token = authResult.session?.access_token;
      const userProfile: UserProfile = authResult.profile;

      setAuth(userProfile, token);
      speakFeedback(
        activeLang === 'hi'
          ? 'सफलतापूर्वक लॉगिन हुआ।'
          : activeLang === 'mr'
            ? 'यशस्वीरित्या लॉगिन झाले.'
            : 'Sign in verified. Navigating to dashboard.'
      );
      routeUserByStatusAndRole(userProfile);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(
        message.toLowerCase().includes('failed to fetch')
          ? 'Unable to reach the authentication service. Ensure backend is operational.'
          : message
      );
      speakFeedback(message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Google OAuth ("Continue with Google") Handler
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      speakFeedback(
        activeLang === 'hi'
          ? 'गूगल लॉगिन खोला जा रहा है।'
          : activeLang === 'mr'
            ? 'Google लॉगिन सुरू होत आहे.'
            : 'Initiating Google sign in.'
      );

      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/login',
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
        if (error) throw error;
      } else {
        // Development fallback when OAuth provider keys are local
        const syncRes = await apiClient.post('/auth/google/sync', {
          supabase_user_id: `google-${selectedRole.toLowerCase()}-001`,
          email: defaultEmails[selectedRole]?.email || 'user@google.com',
          full_name: `${selectedRole.replace(/_/g, ' ')} Google User`,
          role: selectedRole,
        });
        const authResult = syncRes.data?.data || syncRes.data;
        const userProfile: UserProfile = authResult.profile;
        setAuth(userProfile, `dev-mock-${selectedRole.toLowerCase()}-active`);
        routeUserByStatusAndRole(userProfile);
      }
    } catch (err: any) {
      const msg = err.message || 'Google authentication could not be completed.';
      setErrorMessage(msg);
      speakFeedback(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const roleMeta: Record<UserRole, { label: string; hindi: string; marathi: string; tone: string; bg: string }> = {
    COLLECTION_COLLECTOR: {
      label: 'Informal Collector',
      hindi: 'अनौपचारिक कलेक्टर',
      marathi: 'अनौपचारिक संकलक',
      tone: '#176b44',
      bg: '#ecfdf5',
    },
    AUTHORIZED_RECYCLER: {
      label: 'Formal Recycler',
      hindi: 'अधिकृत रीसायकलर',
      marathi: 'अधिकृत रीसायकलर',
      tone: '#0d9488',
      bg: '#f0fdfa',
    },
    GOVERNMENT_ADMIN: {
      label: 'Government Admin',
      hindi: 'सरकारी प्रशासन (CPCB)',
      marathi: 'शासकीय प्रशासन',
      tone: '#1e3a8a',
      bg: '#eff6ff',
    },
    INFORMAL_AGGREGATOR: {
      label: 'Informal Aggregator',
      hindi: 'अनौपचारिक एग्रीगेटर',
      marathi: 'अनौपचारिक ॲग्रीगेटर',
      tone: '#176b44',
      bg: '#ecfdf5',
    },
    USER: {
      label: 'Citizen User',
      hindi: 'उपयोगकर्ता',
      marathi: 'वापरकर्ता',
      tone: '#475569',
      bg: '#f8fafc',
    },
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 460, margin: '0 auto' }}>
      {/* Back to Intro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#64748b',
            fontSize: '0.82rem',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <span>← {activeLang === 'hi' ? 'होम पेज पर वापस' : activeLang === 'mr' ? 'मागे जा' : 'Back to Platform Intro'}</span>
        </Link>
        <button
          type="button"
          onClick={() =>
            speakFeedback(
              activeLang === 'hi'
                ? `आप ${roleMeta[selectedRole].hindi} के रूप में लॉगिन कर रहे हैं। मोबाइल ओटीपी, ईमेल या गूगल साइन इन चुनें।`
                : activeLang === 'mr'
                  ? `आपण ${roleMeta[selectedRole].marathi} म्हणून लॉगिन करत आहात. मोबाईल ओटीपी, ईमेल किंवा Google लॉगिन निवडा.`
                  : `You are signing in as ${roleMeta[selectedRole].label}. Choose mobile number with OTP, email, or Google sign in.`
            )
          }
          title="Listen to spoken instructions"
          style={{
            background: '#f1f5ed',
            border: 'none',
            borderRadius: 20,
            padding: '5px 10px',
            color: '#176b44',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Volume2 size={14} />
          <span>{activeLang === 'hi' ? 'आवाज़ गाइड' : activeLang === 'mr' ? 'मार्गदर्शन' : 'Voice Help'}</span>
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#173b2a', margin: 0 }}>
          {activeLang === 'hi' ? 'सुरक्षित प्लेटफॉर्म साइन इन' : activeLang === 'mr' ? 'सुरक्षित पोर्टल लॉगिन' : 'Platform Sign In'}
        </h2>
        <p style={{ fontSize: '0.86rem', color: '#577262', marginTop: 5 }}>
          {activeLang === 'hi'
            ? 'ई-वेस्ट परिपत्र अर्थव्यवस्था डैशबोर्ड एक्सेस करें'
            : activeLang === 'mr'
              ? 'ई-वेस्ट संकलन व पुनर्चक्रण डॅशबोर्ड'
              : 'E-Waste Circular Chain of Custody'}
        </p>
      </div>

      {/* Role Selection Tabs (Informal Collector, Formal Recycler, Government Admin only) */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: '#f1f5ed', padding: 4, borderRadius: 12 }}>
          {(['COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER', 'GOVERNMENT_ADMIN'] as UserRole[]).map((r) => {
            const isSel = selectedRole === r;
            const meta = roleMeta[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 9,
                  border: 'none',
                  background: isSel ? meta.tone : 'transparent',
                  color: isSel ? '#ffffff' : '#334155',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isSel ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {activeLang === 'hi' ? meta.hindi.split(' ')[0] : activeLang === 'mr' ? meta.marathi.split(' ')[0] : meta.label.split(' ')[0]}
                <br />
                <span style={{ fontSize: '0.68rem', opacity: isSel ? 0.9 : 0.7 }}>
                  {activeLang === 'hi' ? meta.hindi.split(' ')[1] || '' : meta.label.split(' ')[1] || ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Confirmation Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          marginBottom: 16,
          borderRadius: 10,
          background: roleMeta[selectedRole].bg,
          border: `1px solid ${roleMeta[selectedRole].tone}33`,
          color: roleMeta[selectedRole].tone,
          fontSize: '0.85rem',
          fontWeight: 700,
        }}
      >
        <UserCheck size={18} />
        <span>
          {activeLang === 'hi' ? 'प्रमाणित भूमिका:' : activeLang === 'mr' ? 'भूमिका:' : 'Authenticating as:'}{' '}
          {activeLang === 'hi' ? roleMeta[selectedRole].hindi : activeLang === 'mr' ? roleMeta[selectedRole].marathi : roleMeta[selectedRole].label}
        </span>
      </div>

      {/* Error & Success Messages */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(244, 63, 94, 0.12)',
            color: '#e11d48',
            fontSize: '0.84rem',
            fontWeight: 600,
            marginBottom: 16,
            border: '1px solid rgba(244, 63, 94, 0.25)',
          }}
        >
          <AlertCircle size={17} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            background: '#ecfdf5',
            color: '#047857',
            fontSize: '0.84rem',
            fontWeight: 600,
            marginBottom: 16,
            border: '1px solid #a7f3d0',
          }}
        >
          <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Auth Method Tabs: Mobile OTP vs Email */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            setAuthMethod('phone');
            setErrorMessage(null);
          }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 10,
            border: `1.5px solid ${authMethod === 'phone' ? '#176b44' : '#e2e8f0'}`,
            background: authMethod === 'phone' ? '#ecfdf5' : '#ffffff',
            color: authMethod === 'phone' ? '#176b44' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            transition: 'all 0.15s ease',
          }}
        >
          <Phone size={15} />
          <span>{activeLang === 'hi' ? 'मोबाइल ओटीपी' : activeLang === 'mr' ? 'मोबाईल OTP' : 'Mobile OTP'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod('email');
            setErrorMessage(null);
          }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 10,
            border: `1.5px solid ${authMethod === 'email' ? '#176b44' : '#e2e8f0'}`,
            background: authMethod === 'email' ? '#ecfdf5' : '#ffffff',
            color: authMethod === 'email' ? '#176b44' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            transition: 'all 0.15s ease',
          }}
        >
          <Mail size={15} />
          <span>{activeLang === 'hi' ? 'ईमेल और पासवर्ड' : activeLang === 'mr' ? 'ईमेल पासवर्ड' : 'Email & Password'}</span>
        </button>
      </div>

      {/* METHOD 1: MOBILE NUMBER OTP AUTHENTICATION */}
      {authMethod === 'phone' && (
        <div>
          {!otpSent ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                  {activeLang === 'hi' ? 'मोबाइल नंबर' : activeLang === 'mr' ? 'मोबाईल नंबर' : 'Mobile Number'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      padding: '10px 12px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#475569',
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone.replace(/^\+91/, '')}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    required
                    style={{
                      flex: 1,
                      padding: '11px 13px',
                      borderRadius: 8,
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#176b44',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(23, 107, 68, 0.3)',
                }}
              >
                <span>{loading ? 'Sending OTP…' : activeLang === 'hi' ? 'ओटीपी कोड भेजें' : activeLang === 'mr' ? 'OTP कोड पाठवा' : 'Send Verification OTP'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    {activeLang === 'hi' ? '6 अंकों का ओटीपी कोड' : activeLang === 'mr' ? '6 अंकी OTP कोड' : '6-Digit Verification OTP'}
                  </label>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} />
                    <span>Expires in {Math.floor(otpExpiresIn / 60)}:{(otpExpiresIn % 60).toString().padStart(2, '0')}</span>
                  </span>
                </div>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1.5px solid #176b44',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '8px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  ← Change Number
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#94a3b8' : '#176b44',
                    fontWeight: 700,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <RefreshCw size={13} className={loading ? 'spin' : ''} />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#176b44',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(23, 107, 68, 0.3)',
                }}
              >
                <span>{loading ? 'Verifying OTP…' : activeLang === 'hi' ? 'सत्यापित करें और आगे बढ़ें' : activeLang === 'mr' ? 'पडताळणी करा आणि पुढे जा' : 'Verify & Continue'}</span>
                <CheckCircle2 size={16} />
              </button>
            </form>
          )}
        </div>
      )}

      {/* METHOD 2: EMAIL & PASSWORD AUTHENTICATION */}
      {authMethod === 'email' && (
        <form onSubmit={handleEmailLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              {activeLang === 'hi' ? 'ईमेल पता' : activeLang === 'mr' ? 'ईमेल पत्ता' : 'Email Address'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: 8,
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              {activeLang === 'hi' ? 'पासवर्ड' : activeLang === 'mr' ? 'पासवर्ड' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 13px',
                borderRadius: 8,
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: '#176b44',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(23, 107, 68, 0.3)',
            }}
          >
            <span>{loading ? 'Authenticating…' : activeLang === 'hi' ? 'साइन इन करें' : activeLang === 'mr' ? 'साइन इन करा' : 'Authenticate & Continue'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px', color: '#94a3b8' }}>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        <span style={{ padding: '0 12px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {activeLang === 'hi' ? 'या' : activeLang === 'mr' ? 'किंवा' : 'or continue with'}
        </span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>

      {/* METHOD 3: CONTINUE WITH GOOGLE (Official Supabase OAuth) */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 10,
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          color: '#1e293b',
          fontSize: '0.88rem',
          fontWeight: 700,
          cursor: googleLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'background 0.15s ease, box-shadow 0.15s ease',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8fafc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
      </button>

      {/* Registration Link */}
      <div style={{ marginTop: 22, textAlign: 'center', fontSize: '0.84rem', color: '#64748b' }}>
        {activeLang === 'hi' ? 'खाता नहीं है?' : activeLang === 'mr' ? 'खाते नाही का?' : "Don't have an account?"}{' '}
        <Link
          to="/register"
          state={{ selectedRole }}
          style={{ color: '#176b44', fontWeight: 700, textDecoration: 'none' }}
        >
          {activeLang === 'hi' ? 'भूमिका प्रोफाइल पंजीकृत करें' : activeLang === 'mr' ? 'नोंदणी करा' : 'Register Role Profile'}
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
