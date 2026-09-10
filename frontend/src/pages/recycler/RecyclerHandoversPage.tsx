import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  Truck, 
  ArrowLeft, 
  Scale, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import axios from 'axios';

export const RecyclerHandoversPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const url = filterStatus === 'ALL'
        ? 'http://localhost:5000/api/v1/recycler/handovers'
        : `http://localhost:5000/api/v1/recycler/handovers?status=${filterStatus}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHandovers(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Fallback handovers data');
      setHandovers([
        {
          id: 'h-demo-1',
          handover_code: 'RH-2026-881923',
          batch_id: 'b-demo-01',
          handover_type: 'RECYCLER_PICKUP',
          expected_weight: 120.5,
          received_weight: null,
          status: 'IN_TRANSIT',
          vehicle_number: 'MH-04-AZ-8821',
          driver_name: 'Sunil Shinde',
          driver_phone: '+919820011223',
          scheduled_date: new Date().toISOString(),
          recycler_batches: {
            batch_code: 'RB-2026-000101',
            material_categories: { name: 'Consumer Electronics & Computing' },
          },
          recycler_quotes: {
            quote_code: 'RQ-2026-401928',
            rate_per_kg: 32.5,
            total_quote_amount: 3516.25,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, [filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="badge badge-green">RECEIVED</span>;
      case 'IN_TRANSIT':
        return <span className="badge badge-blue">IN TRANSIT</span>;
      case 'ARRIVED':
        return <span className="badge badge-yellow">ARRIVED</span>;
      case 'UNDER_VERIFICATION':
        return <span className="badge badge-purple">UNDER VERIFICATION</span>;
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
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => navigate('/recycler/dashboard')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              {t('nav.handovers', 'Consignments & Receiving')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Weighbridge intake, material verification, digital proof, and handover receipt
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {['ALL', 'IN_TRANSIT', 'ARRIVED', 'UNDER_VERIFICATION', 'RECEIVED', 'DISPUTED'].map((st) => (
          <button
            key={st}
            className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: 20 }}
            onClick={() => setFilterStatus(st)}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Handovers list */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading consignments...
        </div>
      ) : handovers.length === 0 ? (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <Truck size={44} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No handovers found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Consignments will appear here once aggregator accepts quotes and schedules handover manifests.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {handovers.map((h) => (
            <div 
              key={h.id} 
              className="glass-panel" 
              style={{ padding: 22, borderRadius: 14, cursor: 'pointer', transition: 'transform 0.15s' }}
              onClick={() => navigate(`/recycler/handovers/${h.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#3b82f6' }}>{h.handover_code}</span>
                    {getStatusBadge(h.status)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Batch: <strong>{h.recycler_batches?.batch_code || 'RB-Consignment'}</strong> • {h.recycler_batches?.material_categories?.name || 'Consumer Electronics'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      {h.received_weight || h.expected_weight} kg
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {h.received_weight ? 'Verified Received Wt' : 'Manifest Expected Wt'}
                    </div>
                  </div>
                  <ChevronRight size={20} color="var(--text-secondary)" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Vehicle: </span>
                  <strong>{h.vehicle_number || 'Dispatch arranged'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Driver: </span>
                  <span>{h.driver_name || 'Driver assigned'} ({h.driver_phone || 'Contact'})</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Settlement Quote: </span>
                  <strong style={{ color: '#10b981' }}>₹{h.recycler_quotes?.total_quote_amount || 'Pending'}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
