import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Building2, TrendingUp, Users, Scale, PackageCheck } from 'lucide-react';

export const AggregatorDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-amber">Informal Scrap Aggregator Hub</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Yard ID: {user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dharavi Scrap Yard #12</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Consolidate user e-waste lots, analyze price margins, dispatch field collectors, and contract formal bulk sales with CPCB authorized recyclers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary">View Stock-on-Hand</button>
            <button className="btn-primary">Dispatch Collectors</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Requests in Zone</span>
            <PackageCheck size={18} className="text-amber-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>6 Lots</div>
          <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: 4 }}>Ready for collector assignment</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Field Collectors</span>
            <Users size={18} className="text-cyan-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>4 Agents</div>
          <div style={{ fontSize: '0.8rem', color: '#06b6d4', marginTop: 4 }}>All reporting GPS online</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Yard Inventory</span>
            <Scale size={18} className="text-emerald-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>1,240 kg</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>PCB: 420 kg • CRT: 680 kg • Batteries: 140 kg</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Projected Margin</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>₹ 18,400</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>Formal route net profit (+22% vs grey market)</div>
        </div>
      </div>
    </div>
  );
};
