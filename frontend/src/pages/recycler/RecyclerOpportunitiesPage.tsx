import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  Boxes, 
  ArrowLeft, 
  FileText, 
  MapPin, 
  Scale, 
  CheckCircle, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import axios from 'axios';

export const RecyclerOpportunitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  // Quote form state
  const [ratePerKg, setRatePerKg] = useState<number>(32.0);
  const [pickupCost, setPickupCost] = useState<number>(150.0);
  const [transportCost, setTransportCost] = useState<number>(250.0);
  const [notes, setNotes] = useState<string>('Includes facility collection and CPCB certificate.');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/v1/recycler/opportunities', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpportunities(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Fallback opportunities data');
      setOpportunities([
        {
          batch_id: 'b-demo-01',
          batch_code: 'RB-2026-000101',
          material_category_name: 'Consumer Electronics & Computing',
          total_weight_kg: 120.5,
          approximate_location: 'Mumbai Suburban District, Maharashtra',
          pickup_required: true,
          reference_market_rate_per_kg: 28.0,
          estimated_gross_value: 3374.0,
          status: 'READY_FOR_MATCHING',
        },
        {
          batch_id: 'b-demo-02',
          batch_code: 'RB-2026-000102',
          material_category_name: 'Batteries, PCBs & Circuit Boards',
          total_weight_kg: 65.0,
          approximate_location: 'Thane Central, Maharashtra',
          pickup_required: true,
          reference_market_rate_per_kg: 85.0,
          estimated_gross_value: 5525.0,
          status: 'QUOTE_REQUESTED',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const openQuoteModal = (opp: any) => {
    setSelectedOpp(opp);
    setRatePerKg(opp.reference_market_rate_per_kg || 30.0);
    setPickupCost(150.0);
    setTransportCost(250.0);
    setSubmitSuccess(null);
    setQuoteModalOpen(true);
  };

  const handleQuoteSubmit = async () => {
    if (!selectedOpp) return;
    try {
      setSubmitting(true);
      if (!token) return;
      const payload = {
        batch_id: selectedOpp.batch_id,
        rate_per_kg: Number(ratePerKg),
        pickup_cost: Number(pickupCost),
        transport_cost: Number(transportCost),
        notes,
        submit_immediately: true,
      };

      const res = await axios.post('http://localhost:5000/api/v1/recycler/quotes', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const quoteCode = res.data.data?.quote_code || 'RQ-2026-SUCCESS';
      setSubmitSuccess(`Quote ${quoteCode} submitted successfully!`);
      setTimeout(() => {
        setQuoteModalOpen(false);
        navigate('/recycler/quotes');
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit quote.');
    } finally {
      setSubmitting(false);
    }
  };

  const baseAmount = selectedOpp ? Number((selectedOpp.total_weight_kg * ratePerKg).toFixed(2)) : 0;
  const netQuoteAmount = Number((baseAmount - pickupCost - transportCost).toFixed(2));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button 
          className="btn btn-outline" 
          style={{ padding: '8px 12px' }}
          onClick={() => navigate('/recycler/dashboard')}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
            {t('nav.opportunities', 'Open Recycler Opportunities')}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Consolidated aggregator consignments eligible for your facility's authorized schedule codes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading eligible opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <Boxes size={48} color="var(--text-secondary)" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No open opportunities right now</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Check back soon as aggregators consolidate and publish new e-waste batches.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {opportunities.map((opp) => (
            <div 
              key={opp.batch_id} 
              className="glass-panel" 
              style={{ padding: 22, borderRadius: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#3b82f6' }}>{opp.batch_code}</span>
                  <span className="badge badge-purple">{opp.status}</span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 8 }}>
                  {opp.material_category_name}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Scale size={15} />
                    <span>Total Consignment Weight: <strong>{opp.total_weight_kg} kg</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} />
                    <span>{opp.approximate_location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={15} />
                    <span>Benchmark Market Rate: ₹{opp.reference_market_rate_per_kg}/kg</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Est. Gross Value</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>₹{opp.estimated_gross_value}</div>
                </div>
                <button 
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  onClick={() => openQuoteModal(opp)}
                >
                  Submit Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Submission Modal */}
      {quoteModalOpen && selectedOpp && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 520, padding: 26, borderRadius: 16, position: 'relative' }}>
            <button 
              onClick={() => setQuoteModalOpen(false)}
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700 }}>
              Submit Recycler Quote
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Batch: <strong>{selectedOpp.batch_code}</strong> ({selectedOpp.total_weight_kg} kg • {selectedOpp.material_category_name})
            </p>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <CheckCircle size={48} color="#10b981" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#10b981' }}>{submitSuccess}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Offered Purchase Rate (₹ per kg)
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    className="input"
                    value={ratePerKg}
                    onChange={(e) => setRatePerKg(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Pickup & Handling Cost (₹)
                    </label>
                    <input 
                      type="number"
                      className="input"
                      value={pickupCost}
                      onChange={(e) => setPickupCost(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Logistics / Transport Cost (₹)
                    </label>
                    <input 
                      type="number"
                      className="input"
                      value={transportCost}
                      onChange={(e) => setTransportCost(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Notes / Conditions
                  </label>
                  <textarea 
                    className="input"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: '100%', resize: 'none' }}
                  />
                </div>

                {/* Net Quote Calculation Breakdown */}
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 10, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Material Value:</span>
                    <span>₹{baseAmount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#ef4444' }}>
                    <span>Logistics Deductions:</span>
                    <span>-₹{pickupCost + transportCost}</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.98rem' }}>
                    <span>Net Quote Payout to Aggregator:</span>
                    <span style={{ color: '#10b981' }}>₹{netQuoteAmount}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button className="btn btn-outline" onClick={() => setQuoteModalOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleQuoteSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Confirm & Submit Quote'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
