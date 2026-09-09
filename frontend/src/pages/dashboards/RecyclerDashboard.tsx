import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  Factory, 
  ShieldCheck, 
  FileText, 
  Award, 
  Scale, 
  CheckCircle, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export const RecyclerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [batches, setBatches] = useState([
    {
      id: 'batch-01',
      code: 'CONS-2026-088',
      aggregator_name: 'Dharavi Central Scrap Yard',
      category: 'Printed Circuit Boards (High Grade)',
      cpcb_code: 'ITEW1',
      weight_kg: 420.0,
      offered_price_per_kg: 480.0,
      status: 'AVAILABLE_FOR_BIDDING',
      form6_generated: false,
    },
    {
      id: 'batch-02',
      code: 'CONS-2026-089',
      aggregator_name: 'Kurla Electronics Recovery Hub',
      category: 'Cathode Ray Tube (CRT Assemblies)',
      cpcb_code: 'CEEW1',
      weight_kg: 850.0,
      offered_price_per_kg: 24.5,
      status: 'ACCEPTED_IN_TRANSIT',
      form6_generated: true,
    },
  ]);

  const [selectedBatch, setSelectedBatch] = useState<any>(batches[0]);
  const [showManifest, setShowManifest] = useState(false);

  const handleGenerateManifest = (batchId: string) => {
    setBatches(
      batches.map((b) => (b.id === batchId ? { ...b, form6_generated: true, status: 'FORM_6_SIGNED' } : b)),
    );
    setShowManifest(true);
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-purple">Authorized Recycler B2B Console</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CPCB License: CPCB/EW-REG/MH-2023/401</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>EcoClean E-Waste Recyclers Pvt Ltd</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Authorized Hazardous Dismantling & Hydrometallurgical Refining Facility • CPCB Form 6 Manifest Compliance
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(168, 85, 247, 0.15)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <Award size={18} className="text-purple-400" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7e22ce' }}>Verified CPCB R2 Recycler</span>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>EPR Quota Target Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7e22ce' }}>3,420 / 5,000 MT</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>68.4% annual statutory target completed</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Available Aggregator Shipments</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0369a1' }}>2 Batches</div>
          <div style={{ fontSize: '0.8rem', color: '#0369a1', marginTop: 4 }}>1,270 kg secondary feedstock ready</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Active Form 6 Manifests</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857' }}>12 Consignments</div>
          <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: 4 }}>100% auditable chain of custody</div>
        </div>
      </div>

      {/* Batch Marketplace & Form 6 Generator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Left: Aggregator Lots Available */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>Consolidated Aggregator Shipments</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {batches.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBatch(b)}
                style={{
                  background: selectedBatch?.id === b.id ? '#f1f5f9' : '#ffffff',
                  borderRadius: 10,
                  padding: 16,
                  border: selectedBatch?.id === b.id ? '1px solid #7e22ce' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{b.code}</div>
                  <span className="badge badge-purple">{b.cpcb_code}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>{b.category}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Consignor: {b.aggregator_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#0369a1', fontWeight: 700 }}>Total Mass: {b.weight_kg} kg</span>
                  <span style={{ color: '#047857', fontWeight: 800 }}>Total Bid: ₹ {(b.weight_kg * b.offered_price_per_kg).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: CPCB Form 6 Manifest Console */}
        {selectedBatch && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CPCB Form 6 Transfer Manifest</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reference Consignment: {selectedBatch.code}</div>
              </div>
              <span className="badge badge-emerald">E-Waste Rules 2022</span>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, padding: 14, border: '1px solid var(--border-color)', marginBottom: 16, fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Consignor (Informal Aggregator)</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedBatch.aggregator_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Consignee (Formal Recycler)</div>
                  <div style={{ fontWeight: 700, color: '#7e22ce' }}>EcoClean Recyclers Pvt Ltd</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CPCB Schedule I Code</div>
                  <div style={{ fontWeight: 700, color: '#0369a1' }}>{selectedBatch.cpcb_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Certified Mass</div>
                  <div style={{ fontWeight: 700, color: '#047857' }}>{selectedBatch.weight_kg} kg</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGenerateManifest(selectedBatch.id)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #a855f7, #7e22ce)' }}
            >
              <FileText size={18} />
              <span>Generate & Cryptographically Sign Form 6 Manifest</span>
            </button>

            {showManifest && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7e22ce', fontWeight: 800, marginBottom: 4 }}>
                  <CheckCircle size={16} />
                  <span>Manifest MAN-2026-004812 Signed & Lodged!</span>
                </div>
                <div style={{ color: '#334155' }}>
                  SHA-256 Hash: <code style={{ color: '#0369a1' }}>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                </div>
                <div style={{ color: '#475569', marginTop: 4 }}>
                  EPR Credits allocated: <strong>420.0 Units</strong> ready for manufacturer compliance certificates.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
