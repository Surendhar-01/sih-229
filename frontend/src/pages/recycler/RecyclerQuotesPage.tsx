import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  FileText, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Filter,
  DollarSign,
  Scale
} from 'lucide-react';
import axios from 'axios';

export const RecyclerQuotesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const url = filterStatus === 'ALL' 
        ? 'http://localhost:5000/api/v1/recycler/quotes'
        : `http://localhost:5000/api/v1/recycler/quotes?status=${filterStatus}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotes(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Fallback quotes data');
      setQuotes([
        {
          id: 'q-demo-1',
          quote_code: 'RQ-2026-401928',
          batch_id: 'b-demo-01',
          rate_per_kg: 32.5,
          base_amount: 3916.25,
          pickup_cost: 150.0,
          transport_cost: 250.0,
          total_quote_amount: 3516.25,
          status: 'ACCEPTED',
          valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
          created_at: new Date().toISOString(),
          recycler_batches: {
            batch_code: 'RB-2026-000101',
            total_weight: 120.5,
            material_categories: { name: 'Consumer Electronics & Computing' },
          },
        },
        {
          id: 'q-demo-2',
          quote_code: 'RQ-2026-401929',
          batch_id: 'b-demo-02',
          rate_per_kg: 85.0,
          base_amount: 5525.0,
          pickup_cost: 150.0,
          transport_cost: 250.0,
          total_quote_amount: 5125.0,
          status: 'SUBMITTED',
          valid_until: new Date(Date.now() + 86400000 * 2).toISOString(),
          created_at: new Date().toISOString(),
          recycler_batches: {
            batch_code: 'RB-2026-000102',
            total_weight: 65.0,
            material_categories: { name: 'Batteries, PCBs & Circuit Boards' },
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [filterStatus]);

  const handleWithdraw = async (quoteId: string) => {
    if (!confirm('Are you sure you want to withdraw this submitted quote?')) return;
    try {
      if (!token) return;
      await axios.post(`http://localhost:5000/api/v1/recycler/quotes/${quoteId}/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchQuotes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to withdraw quote.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="badge badge-green">ACCEPTED</span>;
      case 'SUBMITTED':
        return <span className="badge badge-blue">SUBMITTED</span>;
      case 'DRAFT':
      case 'PENDING':
        return <span className="badge badge-yellow">DRAFT</span>;
      case 'REJECTED':
        return <span className="badge badge-red">REJECTED</span>;
      case 'WITHDRAWN':
        return <span className="badge badge-red">WITHDRAWN</span>;
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
              {t('nav.quotes', 'My B2B Recycler Quotes')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Track bid proposals, negotiated rates, and aggregator acceptance
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/recycler/opportunities')}>
          Browse More Batches
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {['ALL', 'SUBMITTED', 'ACCEPTED', 'DRAFT', 'REJECTED'].map((st) => (
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

      {/* Quotes List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading quotes...
        </div>
      ) : quotes.length === 0 ? (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <FileText size={44} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No quotes found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            You haven't submitted any quotes in this category yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {quotes.map((q) => (
            <div key={q.id} className="glass-panel" style={{ padding: 20, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#3b82f6' }}>{q.quote_code}</span>
                    {getStatusBadge(q.status)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Consignment: <strong>{q.recycler_batches?.batch_code || 'RB-Consignment'}</strong> • {q.recycler_batches?.material_categories?.name || 'Mixed E-Waste'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                    ₹{q.total_quote_amount}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Rate: ₹{q.rate_per_kg}/kg
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: '0.82rem', marginBottom: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Gross Value: </span>
                  <strong>₹{q.base_amount}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Logistics Deduction: </span>
                  <strong style={{ color: '#ef4444' }}>-₹{Number(q.pickup_cost || 0) + Number(q.transport_cost || 0)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Consignment Wt: </span>
                  <strong>{q.recycler_batches?.total_weight || 50} kg</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Valid Until: </span>
                  <span>{new Date(q.valid_until).toLocaleDateString()}</span>
                </div>
              </div>

              {q.status === 'SUBMITTED' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button 
                    className="btn btn-outline"
                    style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: '0.82rem', padding: '6px 14px' }}
                    onClick={() => handleWithdraw(q.id)}
                  >
                    Withdraw Bid
                  </button>
                </div>
              )}

              {q.status === 'ACCEPTED' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16,185,129,0.08)', padding: '10px 14px', borderRadius: 8, marginTop: 4 }}>
                  <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                    ✓ Quote accepted by aggregator. Handover schedule pending or active.
                  </span>
                  <button 
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                    onClick={() => navigate('/recycler/handovers')}
                  >
                    Track Handover
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
