import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';
import { Camera, Clock, Sparkles, UserCheck, ShieldCheck, MapPin, KeyRound, ArrowRight } from 'lucide-react';
import { AiScannerModal } from '../../components/AiScannerModal';
import { AudioPriceButton } from '../../components/AudioPriceButton';

export const UserDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/lots');
      setLots(res.data || []);
    } catch (err) {
      console.error('Failed to load lots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATERIAL_VERIFIED':
      case 'COLLECTED':
      case 'COMPLETED':
        return <span className="badge badge-emerald">{status.replace('_', ' ')}</span>;
      case 'COLLECTOR_ASSIGNED':
      case 'ON_THE_WAY':
        return <span className="badge badge-amber">{status.replace('_', ' ')}</span>;
      default:
        return <span className="badge badge-cyan">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div>
      {/* Welcome & AI Scan Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-emerald">Citizen Consumer Portal</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome, {user?.full_name}!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Turn old electronics into certified value. Instant AI scanner benchmarks real scrap commodity rates and dispatches verified collectors.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setIsScannerOpen(true)}>
            <Camera size={18} />
            <span>Scan E-Waste with AI</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active E-Waste Lots</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{lots.length} Lots</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>All tracked under CPCB EPR rules</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Value Realized</span>
            <Sparkles size={18} className="text-emerald-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            ₹ {lots.reduce((acc, curr) => acc + (curr.agreed_purchase_price || curr.ai_estimated_min_value || 300), 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Instant UPI / Cash payment on doorstep weighing</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total E-Waste Diverted</span>
            <UserCheck size={18} className="text-cyan-400" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            {lots.reduce((acc, curr) => acc + (curr.verified_weight_kg || curr.estimated_weight_kg || 10), 0).toFixed(1)} kg
          </div>
          <div style={{ fontSize: '0.8rem', color: '#06b6d4', marginTop: 4 }}>Saved from informal acid baths & burning</div>
        </div>
      </div>

      {/* Active Lots Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Your Collection Requests</h2>
          <button onClick={fetchLots} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Refresh Status
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>Loading your lots...</div>
        ) : lots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: '#090d16', borderRadius: 8 }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>No e-waste lots created yet.</p>
            <button className="btn-primary" onClick={() => setIsScannerOpen(true)}>
              <Camera size={16} />
              <span>Scan Your First E-Waste Item</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {lots.map((lot) => (
              <div
                key={lot.id}
                style={{
                  background: '#090d16',
                  borderRadius: 10,
                  padding: 16,
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{lot.lot_code}</span>
                    {getStatusBadge(lot.status)}
                    <span className="badge badge-purple">{lot.category_name || 'Electronics'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 4 }}>{lot.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {lot.pickup_address}
                    </span>
                    <span>Mass: {lot.verified_weight_kg ? `${lot.verified_weight_kg} kg (Verified)` : `~${lot.estimated_weight_kg} kg`}</span>
                    {lot.assigned_collector_name && (
                      <span style={{ color: '#38bdf8' }}>Collector: {lot.assigned_collector_name}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'right' }}>
                  {/* Payout Information */}
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                      ₹ {lot.agreed_purchase_price || lot.ai_estimated_min_value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payout Value</div>
                  </div>

                  {/* Doorstep Verification OTP */}
                  {lot.pickup_otp && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <KeyRound size={12} /> Doorstep OTP
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>
                        {lot.pickup_otp}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Scanner Modal Popup */}
      <AiScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onLotCreated={fetchLots}
      />
    </div>
  );
};
