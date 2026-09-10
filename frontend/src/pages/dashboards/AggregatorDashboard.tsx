import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Scale, 
  PackageCheck, 
  Send, 
  Calculator, 
  CheckCircle2, 
  MapPin, 
  Sparkles,
  ArrowRight,
  Truck,
  Phone,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

export const AggregatorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  
  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [targetCollector, setTargetCollector] = useState<any>(null);
  const [collectorEarning, setCollectorEarning] = useState<number>(120);
  const [aggregatorNotes, setAggregatorNotes] = useState<string>('Please verify e-waste weight on digital scale and enter citizen verification code.');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchLots = async () => {
    try {
      const res: any = await apiClient.get('/lots');
      const fetchedLots = res.data || [];
      setLots(fetchedLots);
      if (fetchedLots.length > 0 && !selectedLot) {
        setSelectedLot(fetchedLots[0]);
        loadRecommendations(fetchedLots[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecommendations = async (lotId: string) => {
    setLoadingRecs(true);
    try {
      const res: any = await apiClient.post(`/aggregator/lots/${lotId}/recommend-collectors`);
      setRecommendations(res.data?.recommended_collectors || res.data?.recommendations || []);
    } catch (err) {
      console.error('Failed to load collector recommendations:', err);
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleSelectLot = (lot: any) => {
    setSelectedLot(lot);
    loadRecommendations(lot.id);
  };

  const openAssignModal = (collector: any) => {
    setTargetCollector(collector);
    setCollectorEarning(120);
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedLot || !targetCollector) return;
    setIsDispatching(true);
    setNotification(null);

    try {
      const res: any = await apiClient.post(`/aggregator/lots/${selectedLot.id}/assign-collector`, {
        collector_id: targetCollector.collector_id,
        collector_earning: Number(collectorEarning),
        aggregator_notes: aggregatorNotes,
      });

      const assignmentCode = res.data?.assignment_code || res.data?.id || 'Assigned';
      setNotification({
        type: 'success',
        message: `Collector ${targetCollector.collector_name} successfully assigned! Assignment Code: ${assignmentCode}`,
      });
      setAssignModalOpen(false);
      await fetchLots();
    } catch (err: any) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.message;
      if (status === 409) {
        setNotification({
          type: 'error',
          message: `Concurrency Lock: This lot already has an active assignment (${errorMsg}). Duplicate assignment prevented.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: `Assignment failed: ${errorMsg}`,
        });
      }
    } finally {
      setIsDispatching(false);
    }
  };

  // Unit Economics Model for Selected Lot
  const calculateUnitEconomics = (lot: any) => {
    if (!lot) return null;
    const citizenPayout = Number(lot.agreed_purchase_price || lot.ai_estimated_min_value || 350.0);
    const expectedRecyclerSale = citizenPayout * 1.55; // Formal recycler purchase price with EPR premium
    const transportCost = 60.0;
    const handlingCost = 35.0;
    const platformFee = Math.round(expectedRecyclerSale * 0.02);
    const netProfit = expectedRecyclerSale - citizenPayout - transportCost - handlingCost - platformFee;
    const profitMargin = Math.round((netProfit / expectedRecyclerSale) * 100);

    return {
      expectedRecyclerSale,
      citizenPayout,
      transportCost,
      handlingCost,
      platformFee,
      netProfit,
      profitMargin,
    };
  };

  const economics = calculateUnitEconomics(selectedLot);
  const isAssigned = selectedLot?.status === 'COLLECTOR_ASSIGNED' || selectedLot?.status === 'ON_THE_WAY' || selectedLot?.status === 'ARRIVED' || selectedLot?.status === 'COLLECTED';

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-amber">Informal Scrap Aggregator Hub</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Yard: Dharavi Central Godown</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Scrap Aggregator Command Hub</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Intelligent Lot Triage • Automated Unit Economics & Margin Optimizer • Smart Field Collector Dispatch
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="badge badge-emerald" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              ✓ CPCB Formalized Pipeline Active
            </span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
            color: notification.type === 'success' ? '#047857' : '#e11d48',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Incoming Citizen Lots</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{lots.length} Lots</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>In your 15km operational zone</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Active Field Runners</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0369a1' }}>Available</div>
          <div style={{ fontSize: '0.8rem', color: '#0369a1', marginTop: 4 }}>GPS location broadcasting</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Consolidated Yard Stock</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857' }}>1,840 kg</div>
          <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: 4 }}>Ready for bulk recycler auction</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Projected Net Profit</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857' }}>₹ 24,800</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>+23% margin vs informal smelters</div>
        </div>
      </div>

      {/* Main Two-Column Layout: Lot Queue + Profit Calculator / Dispatch */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Left Column: Lots List */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Zone E-Waste Collection Queue</h2>
            <button
              onClick={fetchLots}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#f1f5f9',
                border: '1px solid var(--border-color)',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lots.map((lot) => {
              const isLotSelected = selectedLot?.id === lot.id;
              return (
                <div
                  key={lot.id}
                  onClick={() => handleSelectLot(lot)}
                  style={{
                    background: isLotSelected ? '#f1f5f9' : '#ffffff',
                    borderRadius: 8,
                    padding: 14,
                    cursor: 'pointer',
                    border: isLotSelected ? '2px solid #10b981' : '1px solid var(--border-color)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{lot.lot_code}</div>
                    <span className={`badge ${lot.status === 'COLLECTED' ? 'badge-emerald' : lot.status === 'COLLECTOR_ASSIGNED' ? 'badge-cyan' : 'badge-amber'}`}>
                      {lot.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>{lot.description || lot.category_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{lot.pickup_address || 'Mumbai, Maharashtra'}</span>
                    <span style={{ fontWeight: 700, color: '#047857' }}>₹ {lot.agreed_purchase_price || lot.ai_estimated_min_value || 350}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Automated Unit Economics & Collector Dispatch */}
        {selectedLot && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            {/* Status Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={20} className="text-emerald-400" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Unit Economics & Dispatch</h2>
              </div>
              {economics && <span className="badge badge-emerald">{economics.profitMargin}% Net Margin</span>}
            </div>

            {/* Financial Analysis Box */}
            {economics && (
              <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: 'var(--text-primary)' }}>
                  Financial Analysis for {selectedLot.lot_code}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Expected Recycler Sale Value (CPCB Recycler)</span>
                    <span style={{ fontWeight: 700, color: '#047857' }}>+ ₹ {economics.expectedRecyclerSale.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Citizen Purchase Cost</span>
                    <span style={{ fontWeight: 700, color: '#fb7185' }}>- ₹ {economics.citizenPayout.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Field Agent Transport & Fuel</span>
                    <span style={{ fontWeight: 700, color: '#fb7185' }}>- ₹ {economics.transportCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Godown Sorting & Packaging</span>
                    <span style={{ fontWeight: 700, color: '#fb7185' }}>- ₹ {economics.handlingCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>DPI Platform Clearing Fee (2%)</span>
                    <span style={{ fontWeight: 700, color: '#fb7185' }}>- ₹ {economics.platformFee.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem' }}>
                    <span>Net Aggregator Margin</span>
                    <span style={{ color: '#047857' }}>₹ {economics.netProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* If Already Assigned */}
            {isAssigned ? (
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #06b6d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#0369a1', fontWeight: 700 }}>
                  <Truck size={18} />
                  <span>Collector Assigned & In Progress</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 12 }}>
                  This lot is actively dispatched. Current Status: <strong style={{ color: '#047857' }}>{selectedLot.status.replace(/_/g, ' ')}</strong>
                </p>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Concurrency lock active: No additional collectors can be assigned to this lot.
                </div>
              </div>
            ) : (
              /* Smart Collector Matching & Dispatch Section */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={16} className="text-cyan-400" />
                    <span>AI Collector Recommendations</span>
                  </h3>
                  <button
                    onClick={() => loadRecommendations(selectedLot.id)}
                    disabled={loadingRecs}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RefreshCw size={12} className={loadingRecs ? 'animate-spin' : ''} />
                    <span>Recalculate AI</span>
                  </button>
                </div>

                {loadingRecs ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '0.85rem' }}>
                    <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 8px', color: '#10b981' }} />
                    Multi-criteria AI scoring distance, availability, capacity, and reliability...
                  </div>
                ) : recommendations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', background: '#ffffff', borderRadius: 8, border: '1px solid var(--border-color)', color: '#64748b', fontSize: '0.85rem' }}>
                    No available collectors found within 25km zone. Check back shortly.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {recommendations.map((rec: any, idx: number) => {
                      const matchPct = Math.round(rec.match_score || 90);
                      return (
                        <div
                          key={rec.collector_id || idx}
                          style={{
                            background: '#ffffff',
                            padding: 14,
                            borderRadius: 10,
                            border: idx === 0 ? '2px solid #10b981' : '1px solid var(--border-color)',
                            boxShadow: idx === 0 ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{rec.collector_name}</span>
                                {idx === 0 && <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>★ TOP MATCH</span>}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <Truck size={12} />
                                <span>{rec.vehicle_type?.replace(/_/g, ' ') || 'Auto-Rickshaw'}</span>
                                <span>&bull;</span>
                                <MapPin size={12} />
                                <span>{rec.distance_km?.toFixed(1) || '2.5'} km away</span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: matchPct >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                                  color: matchPct >= 85 ? '#047857' : '#0284c7',
                                }}
                              >
                                {matchPct}% Match
                              </span>
                            </div>
                          </div>

                          {/* AI Reason */}
                          {rec.reason && (
                            <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, marginBottom: 8 }}>
                              <Sparkles size={12} style={{ display: 'inline', marginRight: 4, color: '#047857' }} />
                              {rec.reason}
                            </div>
                          )}

                          {/* Score metrics breakdown */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <div style={{ display: 'flex', gap: 8, fontSize: '0.7rem', color: '#64748b' }}>
                              <span>Reliability: <strong>{rec.reliability_score ? `${Math.round(rec.reliability_score * 100)}%` : '96%'}</strong></span>
                              <span>Capacity: <strong>{rec.max_capacity_kg || 400} kg</strong></span>
                            </div>

                            <button
                              type="button"
                              onClick={() => openAssignModal(rec)}
                              disabled={isDispatching}
                              className="btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 6 }}
                            >
                              <Send size={12} />
                              <span>Dispatch Agent</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collector Assignment Modal */}
      {assignModalOpen && targetCollector && selectedLot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} color="#047857" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Dispatch Field Collector</h3>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div><strong>Lot:</strong> {selectedLot.lot_code}</div>
                <div style={{ color: '#64748b', marginTop: 2 }}>{selectedLot.pickup_address}</div>
                <div style={{ marginTop: 6 }}><strong>Assignee:</strong> {targetCollector.collector_name} ({targetCollector.vehicle_type?.replace(/_/g, ' ')})</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Collector Payout / Earning (₹)
                </label>
                <input
                  type="number"
                  value={collectorEarning}
                  onChange={(e) => setCollectorEarning(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Settled into collector ledger upon successful verification & collection.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Pickup & Verification Instructions
                </label>
                <textarea
                  rows={3}
                  value={aggregatorNotes}
                  onChange={(e) => setAggregatorNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDispatching}
                  onClick={handleConfirmAssignment}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {isDispatching ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

