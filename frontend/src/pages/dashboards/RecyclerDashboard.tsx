import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  Factory, 
  ShieldCheck, 
  FileText, 
  Scale, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Truck,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  Boxes
} from 'lucide-react';
import axios from 'axios';

export const RecyclerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await axios.get('http://localhost:5000/api/v1/recycler/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data.data || res.data);
    } catch (err) {
      console.warn('Fallback recycler dashboard data');
      setDashboardData({
        metrics: {
          new_opportunities: 3,
          pending_quotes: 1,
          submitted_quotes: 2,
          accepted_quotes: 1,
          incoming_handovers: 1,
          materials_received_today_kg: 240.5,
          total_received_weight_kg: 1845.0,
          total_processing_capacity_kg: 5000.0,
          available_capacity_kg: 3155.0,
          capacity_utilization_pct: 36.9,
          completed_handovers: 8,
          disputed_handovers: 0,
          estimated_pending_receivable_inr: 48500.0,
        },
        authorization: {
          authorization_number: 'CPCB/EW-REG/MH-2023/401',
          issuing_authority: 'Central Pollution Control Board (CPCB)',
          expiry_date: '2028-12-31',
          verification_status: 'VERIFIED',
          is_expired: false,
          days_until_expiry: 840,
        },
        recent_handovers: [
          {
            id: 'demo-h1',
            handover_code: 'RH-2026-881923',
            status: 'IN_TRANSIT',
            expected_weight: 420.0,
            scheduled_date: new Date().toISOString(),
            vehicle_number: 'MH-04-AZ-8821',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = dashboardData?.metrics || {};
  const auth = dashboardData?.authorization || {};

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Header & CPCB Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.15)', borderRadius: 10 }}>
                <Factory size={24} color="#10b981" />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                {t('recycler.dashboardTitle', 'Authorized Recycler Facility Operations')}
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {t('recycler.dashboardSubtitle', 'CPCB/SPCB Authorized Circular Economy Processing Terminal')} • <strong>EcoClean E-Waste Recyclers Pvt Ltd</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 30,
              background: auth.is_expired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${auth.is_expired ? '#ef4444' : '#10b981'}`,
              color: auth.is_expired ? '#ef4444' : '#10b981',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              {auth.is_expired ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
              <span>{auth.is_expired ? 'CPCB License Expired' : 'CPCB License Verified'}</span>
            </div>
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
              onClick={() => navigate('/recycler/profile')}
            >
              Facility Settings
            </button>
          </div>
        </div>

        {/* Expiry Warning Banner if relevant */}
        {auth.warning && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid #f59e0b',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem'
          }}>
            <AlertTriangle size={18} />
            <span><strong>Notice:</strong> {auth.warning} Please submit compliance renewal documents to avoid matching suspension.</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 24 }}>
        {/* Card 1: New Opportunities */}
        <div 
          className="glass-panel" 
          style={{ padding: 20, borderRadius: 14, cursor: 'pointer', transition: 'transform 0.2s' }}
          onClick={() => navigate('/recycler/opportunities')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('recycler.newOpportunities', 'New Opportunities')}
            </span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Boxes size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6' }}>
            {metrics.new_opportunities || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Available for quoting</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 2: Pending Quotes */}
        <div 
          className="glass-panel" 
          style={{ padding: 20, borderRadius: 14, cursor: 'pointer' }}
          onClick={() => navigate('/recycler/quotes')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('recycler.pendingQuotes', 'Pending Quotes')}
            </span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
            {metrics.submitted_quotes || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            {metrics.accepted_quotes || 0} accepted by aggregators
          </div>
        </div>

        {/* Card 3: Incoming Material */}
        <div 
          className="glass-panel" 
          style={{ padding: 20, borderRadius: 14, cursor: 'pointer' }}
          onClick={() => navigate('/recycler/handovers')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('recycler.incomingMaterial', 'Incoming Consignments')}
            </span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Truck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
            {metrics.incoming_handovers || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            In-transit / Ready for weighing
          </div>
        </div>

        {/* Card 4: Today's Weight */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('recycler.todayWeight', "Today's Weight")}
            </span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              <Scale size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {metrics.materials_received_today_kg || 0} <span style={{ fontSize: '1rem', fontWeight: 400 }}>kg</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            Total: {metrics.total_received_weight_kg || 0} kg processed
          </div>
        </div>
      </div>

      {/* Processing Capacity Section */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} color="#10b981" />
              <span>{t('recycler.capacityGauge', 'Processing Capacity Utilization')}</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Daily Licensed Shredding & Refining Capacity: <strong>{metrics.total_processing_capacity_kg || 5000} kg/day</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
              {metrics.available_capacity_kg || 5000} kg
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: 6 }}>Available</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${Math.min(100, metrics.capacity_utilization_pct || 25)}%`, 
              background: 'linear-gradient(90deg, #10b981, #059669)',
              borderRadius: 6,
              transition: 'width 0.4s ease'
            }} 
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <span>Utilization: {metrics.capacity_utilization_pct || 0}%</span>
          <span>Status: {metrics.available_capacity_kg > 500 ? 'ACTIVE / ACCEPTING LOADS' : 'CAPACITY LOW'}</span>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
        <button 
          className="glass-panel btn-clickable" 
          style={{ padding: '16px 20px', borderRadius: 14, textAlign: 'left', border: 'none', background: 'var(--panel-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          onClick={() => navigate('/recycler/opportunities')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Boxes size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Browse Opportunities</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Open aggregator lots & batches</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-secondary)" />
        </button>

        <button 
          className="glass-panel btn-clickable" 
          style={{ padding: '16px 20px', borderRadius: 14, textAlign: 'left', border: 'none', background: 'var(--panel-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          onClick={() => navigate('/recycler/quotes')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>B2B Quote Console</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Track bids & submitted proposals</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-secondary)" />
        </button>

        <button 
          className="glass-panel btn-clickable" 
          style={{ padding: '16px 20px', borderRadius: 14, textAlign: 'left', border: 'none', background: 'var(--panel-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          onClick={() => navigate('/recycler/handovers')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Scale size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Weighbridge & Receiving</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Inspect incoming loads & confirm</div>
            </div>
          </div>
          <ArrowRight size={18} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Recent Incoming Shipments Section */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={20} color="#3b82f6" />
            <span>Active Incoming Consignments</span>
          </h3>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            onClick={() => navigate('/recycler/handovers')}
          >
            View All Handovers
          </button>
        </div>

        {dashboardData?.recent_handovers?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No incoming shipments scheduled today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dashboardData?.recent_handovers?.map((h: any) => (
              <div 
                key={h.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px 18px', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 10, 
                  border: '1px solid rgba(255,255,255,0.06)',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{h.handover_code}</span>
                    <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{h.status}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Vehicle: {h.vehicle_number || 'Dispatch in transit'} • Expected Weight: <strong>{h.expected_weight} kg</strong>
                  </div>
                </div>

                <button 
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={() => navigate(`/recycler/handovers/${h.id}`)}
                >
                  Inspect & Verify Load
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
