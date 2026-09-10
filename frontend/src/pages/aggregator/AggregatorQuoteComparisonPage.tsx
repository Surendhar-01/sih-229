import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  FileText, 
  ArrowLeft, 
  Award, 
  CheckCircle, 
  Truck, 
  Scale, 
  Calendar, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

export const AggregatorQuoteComparisonPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handover scheduling state
  const [scheduledDate, setScheduledDate] = useState<string>(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
  const [vehicleNumber, setVehicleNumber] = useState<string>('MH-04-AZ-8821');
  const [driverName, setDriverName] = useState<string>('Sunil Shinde');
  const [driverPhone, setDriverPhone] = useState<string>('+919820011223');
  const [scheduling, setScheduling] = useState(false);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const res = await axios.get(`http://localhost:5000/api/v1/aggregator/recycler-batches/${batchId}/quotes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotes(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Fallback quotes comparison');
      setQuotes([
        {
          id: 'q-demo-1',
          quote_code: 'RQ-2026-401928',
          recycler_id: 'ba342f1f-c157-4708-b572-46beecccd868',
          rate_per_kg: 32.5,
          base_amount: 3916.25,
          pickup_cost: 150.0,
          transport_cost: 250.0,
          total_quote_amount: 3516.25,
          is_best_net_value: true,
          status: 'SUBMITTED',
          valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
          recyclers: {
            company_name: 'EcoClean E-Waste Recyclers Pvt Ltd',
            compliance_score: 4.92,
            city: 'Navi Mumbai',
            state: 'Maharashtra',
            is_cpcb_authorized: true,
          },
        },
        {
          id: 'q-demo-2',
          quote_code: 'RQ-2026-401929',
          recycler_id: 'rec-002-greenterra',
          rate_per_kg: 28.0,
          base_amount: 3374.0,
          pickup_cost: 120.0,
          transport_cost: 220.0,
          total_quote_amount: 3034.0,
          is_best_net_value: false,
          status: 'SUBMITTED',
          valid_until: new Date(Date.now() + 86400000 * 2).toISOString(),
          recyclers: {
            company_name: 'GreenTerra Metal Refining Ltd',
            compliance_score: 4.5,
            city: 'Thane',
            state: 'Maharashtra',
            is_cpcb_authorized: true,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [batchId]);

  const handleAcceptQuote = async (quoteId: string) => {
    if (!confirm('Accept this recycler quote? Only one quote can be accepted for this batch.')) return;
    try {
      setAcceptingId(quoteId);
      const token = accessToken || 'dev-mock-informal_aggregator';
      await axios.post(`http://localhost:5000/api/v1/aggregator/recycler-quotes/${quoteId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusMessage('Quote accepted successfully! Capacity reserved for recycler.');
      fetchQuotes();
      setScheduleModalOpen(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert('Conflict: Another quote has already been accepted for this batch.');
      } else {
        alert(err.response?.data?.message || 'Failed to accept quote.');
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCreateHandover = async () => {
    try {
      setScheduling(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const payload = {
        scheduled_date: new Date(scheduledDate).toISOString(),
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        driver_phone: driverPhone,
        handover_type: 'RECYCLER_PICKUP',
      };

      await axios.post(`http://localhost:5000/api/v1/aggregator/recycler-batches/${batchId}/create-handover`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setScheduleModalOpen(false);
      navigate('/aggregator/handovers');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule handover.');
    } finally {
      setScheduling(false);
    }
  };

  const hasAcceptedQuote = quotes.some(q => q.status === 'ACCEPTED');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => navigate(`/aggregator/batches/${batchId}`)}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              {t('aggregator.compareQuotes', 'Compare B2B Recycler Quotes')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Evaluate transparent cost breakdowns, net payouts, and compliance ratings
            </p>
          </div>
        </div>

        {hasAcceptedQuote && (
          <button className="btn btn-primary" onClick={() => setScheduleModalOpen(true)}>
            <Truck size={16} />
            <span>Schedule Handover Manifest</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
          <CheckCircle size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading bids...
        </div>
      ) : quotes.length === 0 ? (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <FileText size={44} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No quotes received yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Request quotes from recommended recyclers to receive transparent competitive bids.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 20 }}>
          {quotes.map((q) => {
            const isAccepted = q.status === 'ACCEPTED';
            const isBestValue = q.is_best_net_value;

            return (
              <div 
                key={q.id}
                className="glass-panel"
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: isAccepted 
                    ? '2px solid #10b981' 
                    : isBestValue 
                    ? '2px solid #3b82f6' 
                    : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {isBestValue && !isAccepted && (
                  <div style={{
                    position: 'absolute', top: -12, right: 18,
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                    padding: '4px 12px', borderRadius: 20
                  }}>
                    {t('aggregator.bestNetValue', '★ Best Net Value')}
                  </div>
                )}

                {isAccepted && (
                  <div style={{
                    position: 'absolute', top: -12, right: 18,
                    background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                    padding: '4px 12px', borderRadius: 20
                  }}>
                    ✓ ACCEPTED & RESERVED
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#3b82f6' }}>{q.quote_code}</span>
                    <span className="badge badge-purple">{q.status}</span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                    {q.recyclers?.company_name || 'EcoClean Recyclers'}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    {q.recyclers?.city}, {q.recyclers?.state} • Rating: {q.recyclers?.compliance_score || 4.9} / 5.0
                  </div>

                  {/* Pricing Breakdown */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Offered Rate:</span>
                      <strong>₹{q.rate_per_kg} / kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Gross Material Value:</span>
                      <span>₹{q.base_amount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#ef4444' }}>
                      <span>Logistics & Transport:</span>
                      <span>-₹{Number(q.pickup_cost || 0) + Number(q.transport_cost || 0)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem' }}>
                      <span>Net Receivable:</span>
                      <span style={{ color: '#10b981' }}>₹{q.total_quote_amount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isAccepted ? (
                    <button className="btn btn-outline" style={{ width: '100%', borderColor: '#10b981', color: '#10b981' }} onClick={() => setScheduleModalOpen(true)}>
                      Schedule Handover
                    </button>
                  ) : hasAcceptedQuote ? (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px 0' }}>
                      Another quote has been accepted
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => handleAcceptQuote(q.id)}
                      disabled={acceptingId === q.id}
                    >
                      {acceptingId === q.id ? 'Accepting...' : 'Accept This Recycler Quote'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Handover Scheduling Modal */}
      {scheduleModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 480, padding: 26, borderRadius: 16 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700 }}>
              Schedule Handover Manifest
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Specify pickup or dispatch vehicle details for the accepted recycler.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Scheduled Handover Date
                </label>
                <input 
                  type="date"
                  className="input"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Vehicle Registration Number
                </label>
                <input 
                  type="text"
                  className="input"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Driver Name
                  </label>
                  <input 
                    type="text"
                    className="input"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Driver Contact
                  </label>
                  <input 
                    type="text"
                    className="input"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button className="btn btn-outline" onClick={() => setScheduleModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateHandover} disabled={scheduling}>
                  {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
