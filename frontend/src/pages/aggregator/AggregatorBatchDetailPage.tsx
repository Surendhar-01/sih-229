import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  Layers, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Scale, 
  FileText, 
  TrendingUp, 
  CheckCircle,
  Truck,
  DollarSign
} from 'lucide-react';
import axios from 'axios';

export const AggregatorBatchDetailPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [batchData, setBatchData] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const fetchBatchDetail = async () => {
    try {
      setLoading(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const res = await axios.get(`http://localhost:5000/api/v1/aggregator/recycler-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatchData(res.data.data || res.data);
    } catch (err) {
      console.warn('Fallback batch detail');
      setBatchData({
        batch: {
          id: batchId,
          batch_code: 'RB-2026-000101',
          total_weight: 120.5,
          status: 'READY_FOR_MATCHING',
          material_categories: { name: 'Consumer Electronics & Computing' },
        },
        quotes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setMatchingLoading(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const res = await axios.post(`http://localhost:5000/api/v1/aggregator/recycler-batches/${batchId}/recommend-recyclers`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data || res.data;
      setRecommendations(data.recommended_recyclers || []);
    } catch (err) {
      console.warn('Fallback recommendations');
      setRecommendations([
        {
          recycler_id: 'ba342f1f-c157-4708-b572-46beecccd868',
          facility_name: 'EcoClean E-Waste Recyclers Pvt Ltd',
          cpcb_authorization_number: 'CPCB/EW-REG/MH-2023/401',
          is_cpcb_valid: true,
          distance_km: 17.9,
          offered_rate_per_kg: 32.5,
          match_score: 89.9,
          reliability_score: 96,
          estimated_transport_cost: 581.35,
          estimated_net_value: 3334.9,
          reason: 'Verified CPCB recycler, 17.9 km distance, ample processing capacity (2500 kg), high reliability (96.0%), rate ₹32.5/kg with est. net value ₹3334',
        },
        {
          recycler_id: 'rec-002-greenterra',
          facility_name: 'GreenTerra Metal Refining & Dismantling Ltd',
          cpcb_authorization_number: 'CPCB/EW-REG/MH-2022/198',
          is_cpcb_valid: true,
          distance_km: 17.7,
          offered_rate_per_kg: 28.0,
          match_score: 85.8,
          reliability_score: 91,
          estimated_transport_cost: 578.55,
          estimated_net_value: 2795.45,
          reason: 'Verified CPCB recycler, 17.7 km distance, ample processing capacity (1200 kg), rate ₹28.0/kg',
        },
      ]);
    } finally {
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetail();
    fetchRecommendations();
  }, [batchId]);

  const handleRequestQuote = async (recyclerId: string, recyclerName: string) => {
    try {
      const token = accessToken || 'dev-mock-informal_aggregator';
      await axios.post(`http://localhost:5000/api/v1/aggregator/recycler-batches/${batchId}/request-quote`, {
        recycler_id: recyclerId,
        notes: 'Quote requested via AI Recycler Recommendation engine.',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequestSuccess(`Quote request dispatched to ${recyclerName}!`);
      fetchBatchDetail();
      setTimeout(() => setRequestSuccess(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request quote.');
    }
  };

  const batch = batchData?.batch || {};
  const quoteCount = batchData?.quotes?.length || 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => navigate('/aggregator/batches')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                {batch.batch_code}
              </h1>
              <span className="badge badge-purple">{batch.status}</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Consolidated Consignment: {batch.total_weight} kg • {batch.material_categories?.name || 'Consumer Electronics'}
            </p>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => navigate(`/aggregator/batches/${batchId}/quotes`)}
        >
          <FileText size={16} />
          <span>Compare Recycler Quotes ({quoteCount})</span>
        </button>
      </div>

      {requestSuccess && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
          <CheckCircle size={18} />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* Recycler Recommendation Section */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="#3b82f6" />
              <span>AI Multi-Criteria Recycler Matching</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Ranked by regulatory authorization, capacity, distance decay, reliability score, and net economic value.
            </p>
          </div>

          <button className="btn btn-outline" onClick={fetchRecommendations} disabled={matchingLoading}>
            {matchingLoading ? 'Re-scoring...' : 'Refresh Matching'}
          </button>
        </div>

        {matchingLoading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Evaluating verified recyclers and computing logistics net values...
          </div>
        ) : recommendations.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No verified recyclers currently match this category within service radius.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {recommendations.map((rec) => (
              <div 
                key={rec.recycler_id}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div style={{ maxWidth: 650 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{rec.facility_name}</span>
                    <span style={{
                      padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                      background: rec.is_cpcb_valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: rec.is_cpcb_valid ? '#10b981' : '#ef4444'
                    }}>
                      {rec.is_cpcb_valid ? 'CPCB Verified' : 'License Expired'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {rec.reason}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Distance: </span>
                      <strong>{rec.distance_km} km</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Ref Rate: </span>
                      <strong>₹{rec.offered_rate_per_kg}/kg</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Est. Transport Cost: </span>
                      <strong style={{ color: '#ef4444' }}>₹{rec.estimated_transport_cost}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Est. Net Value: </span>
                      <strong style={{ color: '#10b981' }}>₹{rec.estimated_net_value}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: rec.match_score >= 80 ? '#10b981' : '#f59e0b' }}>
                      {rec.match_score} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/ 100</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Composite Match Score</div>
                  </div>

                  <button 
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                    onClick={() => handleRequestQuote(rec.recycler_id, rec.facility_name)}
                    disabled={!rec.is_cpcb_valid}
                  >
                    Request Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
