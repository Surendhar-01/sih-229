import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  Layers, 
  ArrowLeft, 
  Scale, 
  Plus, 
  ChevronRight, 
  CheckCircle,
  Truck,
  FileText
} from 'lucide-react';
import axios from 'axios';

export const AggregatorBatchesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const res = await axios.get('http://localhost:5000/api/v1/aggregator/recycler-batches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Fallback batches data');
      setBatches([
        {
          id: 'b-demo-01',
          batch_code: 'RB-2026-000101',
          total_weight: 120.5,
          status: 'READY_FOR_MATCHING',
          material_categories: { name: 'Consumer Electronics & Computing' },
          batch_items: [{ id: 'bi-1', weight: 120.5 }],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="badge badge-green">RECEIVED</span>;
      case 'RECYCLER_SELECTED':
      case 'HANDOVER_PENDING':
        return <span className="badge badge-purple">RECYCLER SELECTED</span>;
      case 'IN_TRANSIT':
        return <span className="badge badge-blue">IN TRANSIT</span>;
      case 'QUOTE_REQUESTED':
        return <span className="badge badge-yellow">QUOTE REQUESTED</span>;
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
              {t('aggregator.batchTitle', 'Consolidated Recycler Batches')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Group multiple collected lots into bulk consignments for formal recycler matching
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/aggregator/inventory')}>
          <Plus size={16} />
          <span>Consolidate From Yard Inventory</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading batches...
        </div>
      ) : batches.length === 0 ? (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <Layers size={44} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No Recycler Batches Created</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 450, margin: '8px auto 16px' }}>
            Go to Yard Inventory, select compatible collected lots, and consolidate them into a wholesale recycler batch.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/aggregator/inventory')}>
            Go to Yard Inventory
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {batches.map((batch) => (
            <div 
              key={batch.id} 
              className="glass-panel" 
              style={{ padding: '18px 22px', borderRadius: 14, cursor: 'pointer', transition: 'transform 0.15s' }}
              onClick={() => navigate(`/aggregator/batches/${batch.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#3b82f6' }}>{batch.batch_code}</span>
                    {getStatusBadge(batch.status)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Category: <strong>{batch.material_categories?.name || 'Consumer Electronics'}</strong> • Lots: {batch.batch_items?.length || 1}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{batch.total_weight} kg</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Consignment Total</div>
                  </div>
                  <ChevronRight size={20} color="var(--text-secondary)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
