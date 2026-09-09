import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Landmark, ShieldAlert, BarChart3, Map, Search, AlertOctagon } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-amber" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                National Regulatory Command Center
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Officer ID: {user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Central Pollution Control Board (CPCB) Oversight</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Macro surveillance across 5 Stakeholder Tiers • State & District Drilldown • AI Anomaly Detection • EPR Credit Audits
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary">
              <Search size={16} />
              <span>Trace Lot Code</span>
            </button>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
              <AlertOctagon size={16} />
              <span>Inspect 3 Anomalies</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Total E-Waste Formalized</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>1,420.8 MT</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>Formalization Rate: 74.2% (+18% YoY)</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Registered Scrap Aggregators</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>184 Yards</div>
          <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: 4 }}>1,250 Active Field Collectors</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Authorized Recyclers</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>42 Facilities</div>
          <div style={{ fontSize: '0.8rem', color: '#c084fc', marginTop: 4 }}>100% CPCB Compliance Score</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
          <div style={{ fontSize: '0.85rem', color: '#fb7185', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={16} />
            <span>AI Anomaly Flags</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb7185' }}>3 Flagged</div>
          <div style={{ fontSize: '0.8rem', color: '#fb7185', marginTop: 4 }}>2 Price Outliers • 1 Hazardous Misrouting</div>
        </div>
      </div>
    </div>
  );
};
