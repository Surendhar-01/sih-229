import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Truck, MapPin, CheckCircle, Wifi, Navigation, Scale } from 'lucide-react';

export const CollectorDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-cyan">Field Collection Agent (PWA)</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agent ID: {user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Ramesh Babu (Runner #04)</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Vehicle: Auto-Rickshaw (MH-02-BT-4122) • Operating Radius: 8.0 km
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.15)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Wifi size={16} className="text-emerald-400" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>Offline Queue: 0 Pending Syncs</span>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>Today's Assigned Pickups</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Active Job Card */}
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-amber">EN ROUTE</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Lot EW-2026-000101</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <MapPin size={14} />
                <span>Flat 402, Green Valley Apartments, Andheri West, Mumbai</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>Payout: ₹ 350</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estimated 18.5 kg (21" CRT TV)</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ flex: 1 }}>
              <Navigation size={16} />
              <span>Open Maps Navigation</span>
            </button>
            <button className="btn-primary" style={{ flex: 1 }}>
              <Scale size={16} />
              <span>Verify Weight & Capture Scale Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
