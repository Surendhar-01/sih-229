import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';
import { Camera, Clock, Sparkles, UserCheck, ShieldCheck, MapPin, KeyRound, ArrowRight, Plus, ChevronRight } from 'lucide-react';
import { AiScannerModal } from '../../components/AiScannerModal';
import { AudioPriceButton } from '../../components/AudioPriceButton';

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/lots/my');
      setLots(res.data || res || []);
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
      case 'WAITING_FOR_QUOTE':
        return <span className="badge badge-cyan">Waiting for Quote</span>;
      case 'MATERIAL_VERIFIED':
      case 'COLLECTED':
      case 'COMPLETED':
        return <span className="badge badge-emerald">{status.replace('_', ' ')}</span>;
      case 'COLLECTOR_ASSIGNED':
      case 'ON_THE_WAY':
        return <span className="badge badge-amber">{status.replace('_', ' ')}</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">Cancelled</span>;
      default:
        return <span className="badge badge-cyan">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div>
      {/* Welcome & Primary E-Waste Lot Creation Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-emerald">Citizen Consumer Portal</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome, {user?.full_name}!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4, maxWidth: 650 }}>
              Turn old electronics into certified value. Our AI vision scanner benchmarks fair market prices, verifies device conditions, and arranges doorstep pickup by certified local runners.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/user/lots/create')}
              style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            >
              <Plus size={18} />
              <span>+ Sell / Recycle E-Waste</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsScannerOpen(true)}
              style={{ padding: '12px 16px', fontSize: '0.95rem' }}
            >
              <Camera size={18} />
              <span>Quick AI Scan</span>
            </button>
          </div>
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
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Your Collection Requests</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click any lot to view full audit trail, photos, and tracking status</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/user/lots')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              View All Lots ({lots.length})
            </button>
            <button onClick={fetchLots} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Refresh Status
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>Loading your lots...</div>
        ) : lots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: '#ffffff', borderRadius: 8 }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>No e-waste lots created yet.</p>
            <button className="btn-primary" onClick={() => navigate('/user/lots/create')}>
              <Plus size={16} />
              <span>Create Your First E-Waste Lot</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {lots.slice(0, 5).map((lot) => (
              <div
                key={lot.id}
                onClick={() => navigate(`/user/lots/${lot.id}`)}
                style={{
                  background: '#ffffff',
                  borderRadius: 10,
                  padding: 16,
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{lot.lot_code}</span>
                    {getStatusBadge(lot.status)}
                    <span className="badge badge-purple">{lot.category_name || 'Electronics'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: 4 }}>{lot.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {lot.pickup_address}
                    </span>
                    <span>Mass: {lot.verified_weight_kg ? `${lot.verified_weight_kg} kg (Verified)` : `~${lot.estimated_weight_kg} kg`}</span>
                    {lot.assigned_collector_name && (
                      <span style={{ color: '#0369a1' }}>Collector: {lot.assigned_collector_name}</span>
                    )}
                  </div>
                </div>


                <div style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'right' }}>
                  {/* Payout Information */}
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                      ₹ {lot.agreed_purchase_price || lot.ai_estimated_min_value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payout Value</div>
                  </div>

                  {/* Doorstep Verification OTP */}
                  {lot.pickup_otp && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <KeyRound size={12} /> Doorstep OTP
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
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
