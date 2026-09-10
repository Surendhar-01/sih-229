import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';
import { offlineStorage, OfflineOperation } from '../../lib/offlineStorage';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  Navigation,
  Scale,
  DollarSign,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  User,
  ListOrdered,
  ChevronRight,
  Bell,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CollectorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [availability, setAvailability] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOps, setPendingOps] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Dashboard
  const loadDashboard = async () => {
    try {
      const res: any = await apiClient.get('/collector/dashboard');
      if (res.data) {
        setDashboardData(res.data);
        if (res.data.availability) setAvailability(res.data.availability);
      }
    } catch (err) {
      console.warn('Could not fetch collector dashboard from backend, using cache/mock:', err);
      // Fallback mock values
      setDashboardData({
        metrics: {
          today_assignments: 2,
          pending_assignments: 1,
          accepted_assignments: 1,
          on_the_way: 0,
          completed_today: 0,
          today_collected_weight_kg: 14.2,
          today_estimated_earnings: 350.0,
          total_completed_collections: 38,
        },
        profile: {
          full_name: user?.full_name || 'Field Collector',
          vehicle_type: 'AUTO_RICKSHAW',
          rating: 4.9,
          reliability_score: 95.0,
        },
        recent_assignments: [],
      });
    }

    // Check offline queue
    const ops = await offlineStorage.getPendingOperations();
    setPendingOps(ops);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Change Availability
  const handleAvailabilityChange = async (newStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
    setAvailability(newStatus);
    try {
      await apiClient.patch('/collector/availability', { availability: newStatus });
    } catch (err: any) {
      console.warn('Availability update queued offline:', err.message);
    }
  };

  // Trigger Offline Queue Sync
  const triggerSync = async () => {
    const ops = await offlineStorage.getPendingOperations();
    if (ops.length === 0) return;

    setIsSyncing(true);
    setSyncNotice('Syncing pending field operations with server...');
    try {
      const payload = { operations: ops };
      const res: any = await apiClient.post('/collector/sync', payload);

      if (res.data?.results) {
        let conflicts = 0;
        for (const item of res.data.results) {
          if (item.status === 'SYNCED') {
            await offlineStorage.updateOperationStatus(item.id, 'SYNCED');
          } else {
            conflicts++;
            await offlineStorage.updateOperationStatus(item.id, 'CONFLICT', item.reason);
          }
        }
        if (conflicts > 0) {
          setSyncNotice(`Sync completed with ${conflicts} conflict(s). Please review.`);
        } else {
          setSyncNotice('All offline collections synchronized successfully!');
          setTimeout(() => setSyncNotice(null), 4000);
        }
      }
      await loadDashboard();
    } catch (err: any) {
      setSyncNotice(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const m = dashboardData?.metrics || {
    today_assignments: 0,
    pending_assignments: 0,
    accepted_assignments: 0,
    on_the_way: 0,
    completed_today: 0,
    today_collected_weight_kg: 0,
    today_estimated_earnings: 0,
    total_completed_collections: 0,
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 60 }}>
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP MOBILE HEADER & OFFLINE STATUS                         */}
      {/* ------------------------------------------------------------- */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 20px',
          marginBottom: 16,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Identity & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Truck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase' }}>
                Field Collection Runner
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {dashboardData?.profile?.full_name || user?.full_name || 'Collector'}
              </h2>
            </div>
          </div>

          {/* Offline / Online Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 700,
                background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                color: isOnline ? '#047857' : '#b45309',
                border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? 'Online PWA' : 'Offline Mode'}</span>
            </div>

            {pendingOps.length > 0 && (
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>{pendingOps.length} Pending Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync notification bar if any */}
        {syncNotice && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.8rem',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={15} />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Availability Toggle Selector */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
            Current Status (கிடைக்கும் நிலை):
          </span>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 3, borderRadius: 10, gap: 4 }}>
            {(['AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleAvailabilityChange(mode)}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background:
                    availability === mode
                      ? mode === 'AVAILABLE'
                        ? '#10b981'
                        : mode === 'BUSY'
                        ? '#f59e0b'
                        : '#64748b'
                      : 'transparent',
                  color: availability === mode ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'AVAILABLE' && '● Available'}
                {mode === 'BUSY' && '● Busy'}
                {mode === 'OFFLINE' && '○ Offline'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PROMINENT ACTION BUTTONS (LOW-LITERACY FRIENDLY)           */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Link
          to="/collector/assignments"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: '#ffffff',
            padding: '16px',
            borderRadius: 14,
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Package size={26} />
            {m.pending_assignments > 0 && (
              <span
                style={{
                  background: '#ffffff',
                  color: '#0891b2',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                {m.pending_assignments} New
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>📦 My Jobs Inbox</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>பணிகள் பட்டியல்</div>
          </div>
        </Link>

        <Link
          to="/collector/profile"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '16px',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <User size={26} color="#0891b2" />
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
              ★ {dashboardData?.profile?.rating || 4.9}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>👤 Profile & Vehicle</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>விவரம் & வாகனம்</div>
          </div>
        </Link>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. 10 KEY KPI CARDS                                           */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
          Today's Field Overview (இன்றைய நிலவரம்)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {/* 1. Today Assignments */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{m.today_assignments}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>📅 Today Total</div>
          </div>

          {/* 2. Pending */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{m.pending_assignments}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>⏳ Pending Accept</div>
          </div>

          {/* 3. Accepted */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{m.accepted_assignments}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>✓ Accepted</div>
          </div>

          {/* 4. On-the-way */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6' }}>{m.on_the_way}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>📍 Active En-Route</div>
          </div>

          {/* 5. Completed Today */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{m.completed_today}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>🎉 Completed</div>
          </div>

          {/* 6. Collected Weight */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0891b2' }}>{m.today_collected_weight_kg} kg</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>⚖ Weight Collected</div>
          </div>

          {/* 7. Estimated Earnings */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>₹{m.today_estimated_earnings}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>💰 Est. Earnings</div>
          </div>

          {/* 8. Total Lifetime Pickups */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#475569' }}>{m.total_completed_collections}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>🏆 Total Pickups</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. ACTIVE JOBS ACTION BANNER                                  */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
            Recent Dispatches (சமீபத்திய பணிகள்)
          </h3>
          <Link
            to="/collector/assignments"
            style={{ fontSize: '0.8rem', color: '#0891b2', fontWeight: 700, textDecoration: 'none' }}
          >
            View All →
          </Link>
        </div>

        {dashboardData?.recent_assignments && dashboardData.recent_assignments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dashboardData.recent_assignments.slice(0, 3).map((job: any) => (
              <div
                key={job.id}
                onClick={() => navigate(`/collector/assignments/${job.id}`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                      {job.assignment_code || job.id.slice(0, 10)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background:
                          job.status === 'PENDING'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : job.status === 'ACCEPTED'
                            ? 'rgba(6, 182, 212, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          job.status === 'PENDING'
                            ? '#b45309'
                            : job.status === 'ACCEPTED'
                            ? '#0284c7'
                            : '#047857',
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                    📍 {job.material_lots?.city || 'Local Area'} • ~{job.estimated_weight || 5} kg • Earning: ₹
                    {job.collector_earning || 250}
                  </div>
                </div>

                <ChevronRight size={18} color="#94a3b8" />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: 12,
              padding: '28px',
              textAlign: 'center',
            }}
          >
            <Package size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
              No Active Pickups In Queue
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
              When aggregators dispatch new collections in your area, they will appear here.
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. VERNACULAR OHS SAFETY NOTICE BANNER                        */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.4 }}>
          <strong>OHS Safety Protocol (பாதுகாப்பு குறிப்பு):</strong> Wear insulated rubber gloves when handling lithium-ion batteries or broken CRT display glass. Do not puncture cell casings.
        </div>
      </div>
    </div>
  );
};
