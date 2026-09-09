import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserCheck, Sparkles, Camera, MapPin, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div>
      {/* Welcome Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-emerald">Citizen Consumer Portal</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Account ID: {user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome back, {user?.full_name}!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Dispose of end-of-life electronics responsibly with instant AI valuation, authorized collector pickups, and guaranteed EPR tracking.
            </p>
          </div>
          <button className="btn-primary" onClick={() => alert('Camera AI Scanning module will be available in Module 12/13')}>
            <Camera size={18} />
            <span>Scan E-Waste with AI</span>
          </button>
        </div>
      </div>

      {/* Grid of Quick Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Pickups</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>1 Active Lot</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>Collector Ramesh Babu en-route (3.2 km away)</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Value Realized</span>
            <Sparkles size={18} className="text-emerald-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>₹ 1,840</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Paid directly via Instant UPI / Cash on Handover</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>E-Waste Diverted from Landfills</span>
            <UserCheck size={18} className="text-cyan-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>38.5 kg</div>
          <div style={{ fontSize: '0.8rem', color: '#06b6d4', marginTop: 4 }}>Form 6 certified formal recycling path</div>
        </div>
      </div>

      {/* Recent Lot Snapshot */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Latest Disposal Lot (EW-2026-000101)</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#090d16', borderRadius: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>21" CRT Color Television</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: <span className="badge badge-amber">COLLECTOR ASSIGNED</span> • Estimated 18.5 kg</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#10b981' }}>₹ 350 – ₹ 480</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Value Range</div>
          </div>
        </div>
      </div>
    </div>
  );
};
