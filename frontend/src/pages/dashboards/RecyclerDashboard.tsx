import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Factory, ShieldCheck, FileText, CheckCircle2, Award } from 'lucide-react';

export const RecyclerDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-purple">Authorized Recycler B2B Console</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>License: CPCB/EW-REG/MH-2023/401</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>EcoClean E-Waste Recyclers Pvt Ltd</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Annual CPCB Licensed Capacity: 5,000 MT • Active EPR Fulfillment: 68.4%
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(168, 85, 247, 0.15)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <Award size={18} className="text-purple-400" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc' }}>CPCB Form 6 Certified</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Available Aggregator Consolidations</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>4 Batches</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>Total weight: 14.8 MT (High Grade PCB & CRTs)</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Pending Inward Consignments</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>2 In-Transit</div>
          <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: 4 }}>Form 6 digital manifest verification required</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>EPR Credits Generated</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>3,420 Credits</div>
          <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: 4 }}>Synced to CPCB National Portal</div>
        </div>
      </div>
    </div>
  );
};
