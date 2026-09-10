import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { checkBackendHealth } from '../services/api';
import {
  Recycle,
  UserCheck,
  Building2,
  Truck,
  Factory,
  Landmark,
  ShieldCheck,
  ArrowRight,
  Activity,
  Languages,
  LogOut,
  Zap,
  ChevronRight,
  X,
  FileCheck,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import i18n from '../i18n/i18n';

interface RoleOption {
  role: UserRole;
  badge: string;
  badgeColor: string;
  title: string;
  tamilTitle: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  highlights: string[];
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, language, setLanguage } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [isHealthy, setIsHealthy] = useState<boolean>(false);

  useEffect(() => {
    const fetchHealth = async () => {
      const data = await checkBackendHealth();
      if (data.status === 'ok') {
        setIsHealthy(true);
        const aiStatus = data.services?.ai_service?.status === 'UP' ? 'AI Microservice UP' : 'AI Standby';
        setHealthStatus(`Gateway Active • ${aiStatus}`);
      } else {
        setIsHealthy(false);
        setHealthStatus('System Standby (Demo Ready)');
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleRoleSelect = (role: UserRole, targetRoute: string) => {
    setIsModalOpen(false);
    navigate('/login', { state: { selectedRole: role, targetRoute } });
  };

  const getDashboardRouteForUser = (role?: UserRole) => {
    switch (role) {
      case 'INFORMAL_AGGREGATOR': return '/aggregator/dashboard';
      case 'COLLECTION_COLLECTOR': return '/collector/dashboard';
      case 'AUTHORIZED_RECYCLER': return '/recycler/dashboard';
      case 'GOVERNMENT_ADMIN': return '/admin/dashboard';
      default: return '/user/dashboard';
    }
  };

  const rolesList: RoleOption[] = [
    {
      role: 'USER',
      badge: 'Tier 1 • Citizen / Consumer',
      badgeColor: '#10b981',
      title: 'Citizen & Bulk Consumer',
      tamilTitle: 'பொதுமக்கள் & நுகர்வோர்',
      tagline: 'Sell & Dispose E-Waste with AI Valuation',
      description: 'Upload scrap photos for instant AI valuation, schedule verified door-step pickup, and earn green disposal certificates.',
      icon: <UserCheck size={26} color="#10b981" />,
      route: '/user/dashboard',
      highlights: ['AI Photo Scrap Appraisal', 'Doorstep Pickup Tracking', 'CPCB Safe Disposal Certificate']
    },
    {
      role: 'INFORMAL_AGGREGATOR',
      badge: 'Tier 2 • Scrap Hub',
      badgeColor: '#f59e0b',
      title: 'Informal Scrap Aggregator',
      tamilTitle: 'ஸ்க்ராப் சேகரிப்பாளர் / கிடங்கு',
      tagline: 'Consolidate Godown Lots & Boost Margins',
      description: 'Formalize your scrap business, aggregate materials into high-purity recycler lots, and earn 15–25% higher market rates from formal recyclers.',
      icon: <Building2 size={26} color="#f59e0b" />,
      route: '/aggregator/dashboard',
      highlights: ['Lot Aggregation Pipeline', '15–25% Margin Premium', 'Direct Recycler Bidding']
    },
    {
      role: 'COLLECTION_COLLECTOR',
      badge: 'Tier 3 • Logistics & Field',
      badgeColor: '#06b6d4',
      title: 'Field Collector & Kabadiwala',
      tamilTitle: 'கள முகவர் / கபடிவாலா',
      tagline: 'Smart Dispatch, Scale Verification & Payout',
      description: 'Accept real-time pickup requests on your mobile app, calibrate scales with QR verification, geotag scrap weights, and receive instant digital payouts.',
      icon: <Truck size={26} color="#06b6d4" />,
      route: '/collector/dashboard',
      highlights: ['PostGIS Smart Routing', 'Digital Scale Geotagging', 'Instant UPI Payout Proof']
    },
    {
      role: 'AUTHORIZED_RECYCLER',
      badge: 'Tier 4 • Industry',
      badgeColor: '#8b5cf6',
      title: 'CPCB Authorized Recycler',
      tamilTitle: 'அங்கீகரிக்கப்பட்ட மறுசுழற்சியாளர்',
      tagline: 'Form 6 Manifests & EPR Credit Engine',
      description: 'Source pre-sorted high-purity e-waste lots, maintain CPCB Form 6 digital chain-of-custody manifests, and generate auditable EPR certificates.',
      icon: <Factory size={26} color="#8b5cf6" />,
      route: '/recycler/dashboard',
      highlights: ['Form 6 Manifest Generator', 'EPR Credit Trading', 'Non-Repudiation Custody Trail']
    },
    {
      role: 'GOVERNMENT_ADMIN',
      badge: 'Tier 5 • Regulatory',
      badgeColor: '#f43f5e',
      title: 'CPCB / SPCB Regulatory Admin',
      tamilTitle: 'அரசு / CPCB கண்காணிப்பாளர்',
      tagline: 'National Circular Command Center',
      description: 'Monitor nationwide e-waste flows, track compliance with E-Waste Rules 2022, inspect real-time anomaly alerts, and audit hazardous extractions.',
      icon: <Landmark size={26} color="#f43f5e" />,
      route: '/admin/dashboard',
      highlights: ['National Circular Telemetry', 'AI Anomaly Detection', 'Audit-Ready Regulatory Ledger']
    }
  ];

  return (
    <div className="landing-page light-theme" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#f8fafc' }}>
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP NAVIGATION BAR                                         */}
      {/* ------------------------------------------------------------- */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 24px',
        }}
      >
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Platform Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Recycle size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>ECOBRIDGES</span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 20,
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    letterSpacing: '0.05em',
                  }}
                >
                  DPI PLATFORM
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                CPCB E-Waste (Management) Rules 2022 Formalization Hub
              </div>
            </div>
          </div>

          {/* Quick Nav & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* System Connection Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                padding: '5px 12px',
                borderRadius: 20,
                border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                fontSize: '0.75rem',
                color: isHealthy ? '#34d399' : '#fbbf24',
              }}
            >
              <Activity size={13} />
              <span style={{ fontWeight: 600 }}>{healthStatus}</span>
            </div>

            {/* Language Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255, 255, 255, 0.06)', padding: '3px 8px', borderRadius: 8 }}>
              <Languages size={14} color="#94a3b8" />
              {['en', 'hi', 'mr'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  style={{
                    background: language === lang ? '#10b981' : 'transparent',
                    color: language === lang ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Login / Dashboard Button */}
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => navigate(getDashboardRouteForUser(user.role))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>Go to {user.role.replace('_', ' ')} Dashboard</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={async () => {
                    await logout();
                  }}
                  title="Sign out"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    padding: '8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <span>Select Role to Login</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section
        style={{
          position: 'relative',
          padding: '72px 24px 60px',
          background: 'radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0) 70%)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* Government Compliance Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 30,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            <ShieldCheck size={16} />
            <span>Digital Public Infrastructure for India's E-Waste (Management) Rules 2022</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: 20,
              background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            National E-Waste Management & Formalization Platform
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: '#94a3b8',
              lineHeight: 1.6,
              maxWidth: 760,
              margin: '0 auto 36px',
            }}
          >
            Empowering <strong>1.7M+ tonnes</strong> of Indian e-waste circularity by bridging Citizens, 
            Informal Aggregators, Field Collectors, CPCB Licensed Recyclers, and Regulators with 
            <strong> AI scrap appraisal, PostGIS routing, and CPCB Form 6 digital manifests</strong>.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 10,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Zap size={18} />
              <span>Select Your Role to Login (உள்நுழைக)</span>
              <ArrowRight size={18} />
            </button>

            <a
              href="#roles-section"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '14px 24px',
                borderRadius: 10,
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Explore Stakeholder Portals</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              flexWrap: 'wrap',
              marginTop: 40,
              fontSize: '0.82rem',
              color: '#64748b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>CPCB Form 6 Certified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#06b6d4" />
              <span>AI Scrap Valuation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#f59e0b" />
              <span>15–25% Informal Margin Boost</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#8b5cf6" />
              <span>EPR Credit Generation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. NATIONAL IMPACT METRICS                                    */}
      {/* ------------------------------------------------------------- */}
      <section style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.03em' }}>1.71M+</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>Tonnes Annual E-Waste</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>India's current e-waste generation managed under CPCB targets</div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.03em' }}>90%+</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>Informal Formalization</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Kabadiwalas & godowns bridged into formal legal recycling streams</div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.03em' }}>+22.4%</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>Aggregator Net Profit Margin</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Higher recovery value via direct CPCB formal recycler bulk bidding</div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#c084fc', letterSpacing: '-0.03em' }}>100%</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>Form 6 Chain of Custody</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Digital manifests with immutable non-repudiation audit trails</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. CHOOSE YOUR ROLE / 5 ECOSYSTEM PILLARS                     */}
      {/* ------------------------------------------------------------- */}
      <section
        id="roles-section"
        style={{
          padding: '60px 24px 80px',
          background: 'rgba(255, 255, 255, 0.015)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              Interactive Role Portals (யாருக்கு என்ன வசதி?)
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Who Are You In The Circular Ecosystem?
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: 8 }}>
              Click any role card below to log in directly into that specific role dashboard.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {rolesList.map((item) => (
              <div
                key={item.role}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = item.badgeColor;
                  e.currentTarget.style.boxShadow = `0 12px 28px rgba(0, 0, 0, 0.4)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleRoleSelect(item.role, item.route)}
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span
                      style={{
                        background: `${item.badgeColor}22`,
                        color: item.badgeColor,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 20,
                        border: `1px solid ${item.badgeColor}44`,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.badge}
                    </span>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${item.badgeColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${item.badgeColor}33`,
                      }}
                    >
                      {item.icon}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: 2 }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: item.badgeColor, fontWeight: 600, marginBottom: 10 }}>
                    {item.tamilTitle}
                  </div>
                  <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                    {item.description}
                  </p>

                  {/* Highlights */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                    {item.highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <CheckCircle2 size={13} color={item.badgeColor} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Login CTA */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoleSelect(item.role, item.route);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    border: `1px solid ${item.badgeColor}66`,
                    background: `${item.badgeColor}18`,
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.badgeColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${item.badgeColor}18`;
                  }}
                >
                  <span>Login as {item.title.split(' ')[0]}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. CORE DPI INNOVATIONS                                       */}
      {/* ------------------------------------------------------------- */}
      <section style={{ padding: '72px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Technology & DPI Pillars
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>
            Engineered for India's Unique E-Waste Realities
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '24px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Cpu size={22} color="#34d399" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>AI Vision & Scrap Valuation</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              YOLOv8 deep learning model classifies discarded components, predicts precious metal yields, and computes transparent market pricing.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '24px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <MapPin size={22} color="#38bdf8" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>PostGIS Geotagged Logistics</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Spatial clustering and dispatch optimization connect kabadiwala runners to pickups with calibrated scale weight GPS verification.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '24px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <AlertTriangle size={22} color="#fbbf24" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>Vernacular OHS Safety</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Audio & pictorial warnings in English, Hindi, and Marathi prevent dangerous handling of CRTs, lithium-ion cells, and toxic acid leaching.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: '24px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <FileCheck size={22} color="#c084fc" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>Form 6 & Auditable EPR</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Digital double-entry custody manifests fulfill CPCB E-Waste Rules 2022 legal mandates, generating verified Extended Producer Responsibility credits.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>National E-Waste Management Platform • Built in Compliance with CPCB E-Waste (Management) Rules 2022</span>
          </div>
          <div>
            Citizen • Informal Aggregator • Field Collector • Authorized Recycler • Government Regulatory Admin
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 7. INTERACTIVE ROLE SELECTION LOGIN MODAL                     */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.32)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              maxWidth: 740,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.28)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Zap size={16} />
                  <span>Select Role to Login (உள்நுழைய வேண்டிய பங்கைத் தேர்வுசெய்க)</span>
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  Who Are You Logging In As?
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 2 }}>
                  Click your target role below to instantly authenticate and enter your specific dashboard:
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: 8,
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Role Cards in Modal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rolesList.map((item) => (
                <div
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role, item.route)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${item.badgeColor}15`;
                    e.currentTarget.style.borderColor = item.badgeColor;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: `${item.badgeColor}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: item.badgeColor, fontWeight: 700 }}>
                          ({item.tamilTitle})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                        {item.tagline}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: item.badgeColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Login <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Alternative Form Login Link */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: '#64748b',
              }}
            >
              <span>Want to enter phone number / OTP or email password?</span>
              <Link
                to="/login"
                onClick={() => setIsModalOpen(false)}
                style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>Classic Login Screen</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
