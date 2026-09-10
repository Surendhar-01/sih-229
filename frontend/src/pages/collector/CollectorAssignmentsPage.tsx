import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../services/api';
import {
  Package,
  Search,
  Filter,
  MapPin,
  Clock,
  ArrowRight,
  Truck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ChevronLeft,
} from 'lucide-react';

export const CollectorAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/collector/assignments', {
        params: {
          status: activeTab === 'ALL' ? undefined : activeTab,
          search: searchQuery || undefined,
        },
      });
      setAssignments(res.data || []);
    } catch (err) {
      console.warn('Could not fetch assignments from backend, using demo records:', err);
      // Realistic demo mock
      const mockList = [
        {
          id: 'assign-demo-01',
          assignment_code: 'CA-2026-000101',
          lot_id: 'lot-demo-01',
          status: 'PENDING',
          estimated_weight: 8.5,
          expected_amount: 450.0,
          collector_earning: 180.0,
          created_at: new Date().toISOString(),
          priority: 'NORMAL',
          pickup_latitude: 19.1197,
          pickup_longitude: 72.8464,
          material_lots: {
            id: 'lot-demo-01',
            lot_code: 'EW-2026-000101',
            user_confirmed_category: 'CONSUMER_ELECTRONICS',
            city: 'Andheri West, Mumbai',
            address_line: 'Flat 402, Green Valley Apartments',
            pickup_time_preference: 'Morning (9 AM - 12 PM)',
          },
        },
        {
          id: 'assign-demo-02',
          assignment_code: 'CA-2026-000102',
          lot_id: 'lot-demo-02',
          status: 'ACCEPTED',
          estimated_weight: 14.0,
          expected_amount: 1100.0,
          collector_earning: 250.0,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          priority: 'HIGH',
          pickup_latitude: 19.1245,
          pickup_longitude: 72.8512,
          material_lots: {
            id: 'lot-demo-02',
            lot_code: 'EW-2026-000102',
            user_confirmed_category: 'IT_TELECOM',
            city: 'Juhu Scheme, Mumbai',
            address_line: 'Plot 12, Gulmohar Road',
            pickup_time_preference: 'Afternoon (1 PM - 4 PM)',
          },
        },
        {
          id: 'assign-demo-03',
          assignment_code: 'CA-2026-000098',
          lot_id: 'lot-demo-03',
          status: 'COLLECTED',
          estimated_weight: 22.5,
          expected_amount: 1850.0,
          collector_earning: 350.0,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          collected_at: new Date(Date.now() - 82000000).toISOString(),
          priority: 'NORMAL',
          pickup_latitude: 19.076,
          pickup_longitude: 72.8777,
          material_lots: {
            id: 'lot-demo-03',
            lot_code: 'EW-2026-000098',
            user_confirmed_category: 'LARGE_APPLIANCES',
            city: 'Bandra East, Mumbai',
            address_line: 'Shop 4, Kalanagar Market',
          },
        },
      ];
      setAssignments(mockList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [activeTab]);

  const filteredAssignments = assignments.filter((a) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      a.assignment_code?.toLowerCase().includes(q) ||
      a.material_lots?.lot_code?.toLowerCase().includes(q) ||
      a.material_lots?.city?.toLowerCase().includes(q) ||
      a.material_lots?.address_line?.toLowerCase().includes(q)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'OFFERED':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#b45309', label: 'Pending Acceptance' };
      case 'ACCEPTED':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#0284c7', label: 'Accepted • Ready to Start' };
      case 'ON_THE_WAY':
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#7c3aed', label: 'On The Way' };
      case 'ARRIVED':
        return { bg: 'rgba(236, 72, 153, 0.15)', text: '#db2777', label: 'Arrived at Location' };
      case 'MATERIAL_VERIFIED':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb', label: 'Material & Weight Verified' };
      case 'COLLECTED':
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#047857', label: 'Collected • Success' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#475569', label: status };
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: 14 }}>
        <Link
          to="/collector/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#0891b2',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to Field Dashboard</span>
        </Link>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
          Collector Assignments Inbox (பணிகள்)
        </h1>
        <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 2 }}>
          Accept new pickup dispatches, navigate to user locations, and log verified scale weights.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: 12 }} />
        <input
          type="text"
          placeholder="Search by Lot ID, Assignment Code, or Area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 42px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '0.88rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {[
          { key: 'ALL', label: 'All Jobs' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'ACCEPTED', label: 'Accepted' },
          { key: 'ACTIVE', label: 'Active En-Route' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.78rem',
              fontWeight: 700,
              border: activeTab === tab.key ? '1px solid #0891b2' : '1px solid #e2e8f0',
              background: activeTab === tab.key ? '#0891b2' : '#ffffff',
              color: activeTab === tab.key ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
          Loading collection assignments...
        </div>
      ) : filteredAssignments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredAssignments.map((a) => {
            const sc = getStatusColor(a.status);
            return (
              <div
                key={a.id}
                onClick={() => navigate(`/collector/assignments/${a.id}`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0891b2';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)';
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                      {a.assignment_code || a.id.slice(0, 12)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: sc.bg,
                        color: sc.text,
                      }}
                    >
                      {sc.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a' }}>
                    +₹{a.collector_earning || 250} Earning
                  </div>
                </div>

                {/* Body info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem', color: '#475569', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#0891b2" />
                    <span>
                      {a.material_lots?.address_line ? `${a.material_lots.address_line}, ` : ''}
                      {a.material_lots?.city || 'Central Area'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Package size={13} /> {a.material_lots?.user_confirmed_category || 'Electronics'}
                    </span>
                    <span>⚖ ~{a.estimated_weight || 5} kg</span>
                    {a.material_lots?.pickup_time_preference && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} /> {a.material_lots.pickup_time_preference}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>
                    Lot ID: {a.material_lots?.lot_code || a.lot_id?.slice(0, 10)}
                  </span>
                  <span
                    style={{
                      color: '#0891b2',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Open Action Flow <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: 14,
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <Package size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.95rem' }}>No matching assignments found</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
            Try clearing search filters or check back later for new dispatches.
          </div>
        </div>
      )}
    </div>
  );
};
