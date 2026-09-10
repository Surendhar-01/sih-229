import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  Truck, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Scale, 
  Navigation,
  Send
} from 'lucide-react';
import axios from 'axios';

export const AggregatorHandoversPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const res = await axios.get('http://localhost:5000/api/v1/aggregator/handovers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHandovers(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Fallback aggregator handovers');
      setHandovers([
        {
          id: 'h-demo-1',
          handover_code: 'RH-2026-881923',
          batch_id: 'b-demo-01',
          expected_weight: 120.5,
          received_weight: null,
          status: 'SCHEDULED',
          vehicle_number: 'MH-04-AZ-8821',
          driver_name: 'Sunil Shinde',
          driver_phone: '+919820011223',
          scheduled_date: new Date().toISOString(),
          recyclers: { company_name: 'EcoClean E-Waste Recyclers Pvt Ltd', city: 'Navi Mumbai' },
          recycler_batches: { batch_code: 'RB-2026-000101', material_categories: { name: 'Consumer Electronics' } },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, []);

  const handleDispatch = async (handoverId: string) => {
    try {
      setDispatchingId(handoverId);
      const token = accessToken || 'dev-mock-informal_aggregator';
      await axios.post(`http://localhost:5000/api/v1/aggregator/handovers/${handoverId}/dispatch`, {
        notes: 'Dispatched from aggregator central warehouse gate.',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHandovers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch shipment.');
    } finally {
      setDispatchingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="badge badge-green">RECEIVED & VERIFIED</span>;
      case 'IN_TRANSIT':
        return <span className="badge badge-blue">IN TRANSIT</span>;
      case 'ARRIVED':
        return <span className="badge badge-yellow">ARRIVED AT FACILITY</span>;
      case 'SCHEDULED':
        return <span className="badge badge-purple">SCHEDULED</span>;
      case 'DISPUTED':
        return <span className="badge badge-red">DISPUTED</span>;
      default:
        return <span className="badge badge-purple">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => navigate('/aggregator/dashboard')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              Recycler Consignment Handovers
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Track dispatch, in-transit custody, gate delivery, and facility verification
            </p>
          </div>
        </div>

        <button className="btn btn-outline" onClick={() => navigate('/aggregator/batches')}>
          View Recycler Batches
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading handovers...
        </div>
      ) : handovers.length === 0 ? (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <Truck size={44} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No Handovers Scheduled</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            When you accept a recycler quote and schedule a handover, the manifests will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {handovers.map((h) => (
            <div key={h.id} className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#3b82f6' }}>{h.handover_code}</span>
                    {getStatusBadge(h.status)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Destination: <strong>{h.recyclers?.company_name || 'EcoClean Recyclers'}</strong> ({h.recyclers?.city}) • Batch: {h.recycler_batches?.batch_code}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{h.expected_weight} kg</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manifest Weight</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: '0.82rem', marginBottom: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Vehicle: </span>
                  <strong>{h.vehicle_number || 'Arranging'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Driver: </span>
                  <span>{h.driver_name} ({h.driver_phone})</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Scheduled: </span>
                  <span>{new Date(h.scheduled_date).toLocaleDateString()}</span>
                </div>
              </div>

              {h.status === 'SCHEDULED' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                    onClick={() => handleDispatch(h.id)}
                    disabled={dispatchingId === h.id}
                  >
                    <Send size={15} />
                    <span>{dispatchingId === h.id ? 'Dispatching...' : 'Dispatch Shipment to Recycler'}</span>
                  </button>
                </div>
              )}

              {h.status === 'IN_TRANSIT' && (
                <div style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: 600, background: 'rgba(59,130,246,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                  🚚 Shipment dispatched and in transit to recycler weighbridge.
                </div>
              )}

              {h.status === 'RECEIVED' && (
                <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                  ✓ Consignment successfully received and verified by recycler ({h.received_weight || h.expected_weight} kg).
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
