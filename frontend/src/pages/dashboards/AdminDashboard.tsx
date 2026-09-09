import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  Landmark, 
  ShieldAlert, 
  Search, 
  Map, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  ArrowRight,
  TrendingUp,
  Building2,
  Truck,
  Factory,
  Radio
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'traceability' | 'gis_map' | 'anomalies'>('overview');
  const [searchLotCode, setSearchLotCode] = useState('EW-2026-000101');
  const [searchedLot, setSearchedLot] = useState<any>({
    lot_code: 'EW-2026-000101',
    category: 'Cathode Ray Tube (CRT Monitors & TVs)',
    stages: [
      { name: '1. Citizen Disposal Request', status: 'COMPLETED', time: '10:04 AM', actor: 'Anita Sharma (Citizen)' },
      { name: '2. AI Computer Vision Scan & Valuation', status: 'COMPLETED', time: '10:05 AM', actor: 'MobileNetV3 (94.2% Confidence)' },
      { name: '3. Aggregator Triage & Margin Analysis', status: 'COMPLETED', time: '10:32 AM', actor: 'Dharavi Central Yard' },
      { name: '4. Smart Collector Dispatch', status: 'COMPLETED', time: '11:15 AM', actor: 'Ramesh Babu (Runner #04)' },
      { name: '5. Doorstep Scale Verification & OTP', status: 'PENDING', time: 'In-Progress', actor: 'Awaiting scale weighing' },
      { name: '6. Recycler Form 6 Consignment', status: 'PENDING', time: 'Pending', actor: 'EcoClean Recyclers Ltd' },
    ],
  });

  const [anomalies, setAnomalies] = useState([
    {
      id: 'anom-01',
      lot_code: 'EW-2026-000045',
      risk_level: 'HIGH',
      detector_type: 'PRICE_OUTLIER',
      expected_range: '₹ 320 – ₹ 450',
      actual_price: '₹ 850.00 / kg',
      deviation: '+ 64.2%',
      reason: 'Quoted price exceeds 30-day regional standard by 64.2%. Suspected subsidy fraud or illicit battery mixing.',
      is_resolved: false,
    },
    {
      id: 'anom-02',
      lot_code: 'EW-2026-000078',
      risk_level: 'CRITICAL',
      detector_type: 'HAZARDOUS_MISROUTING',
      expected_range: 'CPCB Certified Yard',
      actual_price: 'Informal Yard #07',
      deviation: 'High Hazard Risk',
      reason: '240kg of leaded CRT funnel glass diverted to unlicensed residential dismantler without vacuum suction kit.',
      is_resolved: false,
    },
  ]);

  const handleResolveAnomaly = (id: string) => {
    setAnomalies(
      anomalies.map((a) => (a.id === id ? { ...a, is_resolved: true } : a)),
    );
    alert('Anomaly flagged for regional SPCB enforcement audit.');
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-amber" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                National CPCB Regulatory Command Center
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Officer: CPCB-REG-HQ-01</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>National E-Waste Flow & Traceability Surveillance</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Macro Surveillance Across 5 Tiers • Real-Time GIS Heatmaps • Cryptographic Chain-of-Custody • AI Fraud Triaging
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="badge badge-emerald" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              ✓ CPCB EPR Rule 2022 Central Registry Active
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          National Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('traceability')}
          className={activeTab === 'traceability' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Universal Lot Traceability
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gis_map')}
          className={activeTab === 'gis_map' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Real-Time GIS Pinboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('anomalies')}
          className={activeTab === 'anomalies' ? 'btn-primary' : 'btn-secondary'}
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            background: activeTab === 'anomalies' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : '#1e293b',
          }}
        >
          AI Anomaly Desk ({anomalies.filter((a) => !a.is_resolved).length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Total E-Waste Formalized</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399' }}>1,420.8 MT</div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>Formalization Rate: 74.2% (+18% YoY)</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Registered Scrap Aggregators</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>184 Yards</div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: 4 }}>1,250 Active Field Collectors</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Authorized Recyclers</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#c084fc' }}>42 Facilities</div>
              <div style={{ fontSize: '0.8rem', color: '#c084fc', marginTop: 4 }}>100% CPCB Environmental Compliance</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
              <div style={{ fontSize: '0.85rem', color: '#fb7185', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertOctagon size={16} />
                <span>Active Anomalies</span>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fb7185' }}>
                {anomalies.filter((a) => !a.is_resolved).length} Flagged
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fb7185', marginTop: 4 }}>Immediate investigation required</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIVERSAL LOT TRACEABILITY */}
      {activeTab === 'traceability' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <input
                type="text"
                value={searchLotCode}
                onChange={(e) => setSearchLotCode(e.target.value)}
                placeholder="Enter Lot ID (e.g. EW-2026-000101)"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, background: '#090d16', color: '#fff', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', fontWeight: 700 }}
              />
            </div>
            <button
              type="button"
              onClick={() => alert(`Fetching verified chain-of-custody for ${searchLotCode}`)}
              className="btn-primary"
            >
              <Search size={18} />
              <span>Trace End-to-End Custody</span>
            </button>
          </div>

          <div style={{ background: '#090d16', borderRadius: 10, padding: 20, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Lot Audit: {searchedLot.lot_code}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Material: {searchedLot.category}</div>
              </div>
              <span className="badge badge-amber">ACTIVE IN FIELD</span>
            </div>

            {/* Stages Progression */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {searchedLot.stages.map((stage: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: stage.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.08)' : '#1e293b',
                    borderLeft: `4px solid ${stage.status === 'COMPLETED' ? '#10b981' : '#f59e0b'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {stage.status === 'COMPLETED' ? (
                      <CheckCircle size={18} className="text-emerald-400" />
                    ) : (
                      <Radio size={18} className="text-amber-400" />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{stage.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Actor: {stage.actor}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${stage.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                      {stage.status}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{stage.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REAL-TIME GIS PINBOARD */}
      {activeTab === 'gis_map' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Real-Time Geospatial Cluster Surveillance</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live GPS positions across Greater Mumbai & Thane E-Waste Corridors</p>
            </div>
            <span className="badge badge-emerald">4 Active GPS Feeders</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#090d16', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Truck size={18} className="text-cyan-400" />
                <span style={{ fontWeight: 700 }}>Collector #04 (Ramesh Babu)</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Location: Andheri West (19.1363° N, 72.8277° E)</div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: 4 }}>En-route to pick up Lot EW-2026-000101</div>
            </div>

            <div style={{ background: '#090d16', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Building2 size={18} className="text-amber-400" />
                <span style={{ fontWeight: 700 }}>Dharavi Scrap Consolidation Hub</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Location: Dharavi Yard 12 (19.0434° N, 72.8567° E)</div>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>1,840 kg stock ready for formal dispatch</div>
            </div>

            <div style={{ background: '#090d16', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Factory size={18} className="text-purple-400" />
                <span style={{ fontWeight: 700 }}>EcoClean Recyclers Ltd (Formal)</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Location: Taloja MIDC (19.0833° N, 73.1167° E)</div>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: 4 }}>CPCB Licensed Facility (5,000 MT Annual)</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI ANOMALY DESK */}
      {activeTab === 'anomalies' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>AI Transaction & Safety Anomaly Triaging</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {anomalies.map((a) => (
              <div
                key={a.id}
                style={{
                  background: '#090d16',
                  borderRadius: 10,
                  padding: 18,
                  border: a.is_resolved ? '1px solid #10b981' : '1px solid rgba(244, 63, 94, 0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                      {a.risk_level} RISK
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{a.lot_code}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type: {a.detector_type}</span>
                  </div>
                  {a.is_resolved ? (
                    <span className="badge badge-emerald">RESOLVED & AUDITED</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleResolveAnomaly(a.id)}
                      className="btn-primary"
                      style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      Audit & Restrict Yard
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 12 }}>{a.reason}</p>

                <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span>Expected Benchmark: <strong style={{ color: '#fff' }}>{a.expected_range}</strong></span>
                  <span>Reported Value: <strong style={{ color: '#fb7185' }}>{a.actual_price}</strong></span>
                  <span>Deviation: <strong style={{ color: '#fb7185' }}>{a.deviation}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
