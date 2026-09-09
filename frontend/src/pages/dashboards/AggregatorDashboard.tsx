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
  ArrowRight
} from 'lucide-react';

export const AggregatorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const fetchLots = async () => {
    try {
      const res: any = await apiClient.get('/lots');
      setLots(res.data || []);
      if (res.data?.length > 0 && !selectedLot) {
        setSelectedLot(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleDispatchCollector = async (lotId: string, collectorId: string, collectorName: string) => {
    setIsDispatching(true);
    try {
      await apiClient.post(`/lots/${lotId}/assign-collector`, {
        collector_id: collectorId,
        collector_name: collectorName,
      });
      alert(`Collector ${collectorName} successfully dispatched to lot!`);
      await fetchLots();
    } catch (err: any) {
      alert(`Dispatch failed: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Unit Economics Model for Selected Lot
  const calculateUnitEconomics = (lot: any) => {
    if (!lot) return null;
    const citizenPayout = lot.agreed_purchase_price || lot.ai_estimated_min_value || 350.0;
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

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Incoming Citizen Lots</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{lots.length} Lots</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4 }}>In your 15km operational zone</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Active Field Runners</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0369a1' }}>3 Collectors</div>
          <div style={{ fontSize: '0.8rem', color: '#0369a1', marginTop: 4 }}>All reporting GPS active</div>
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
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>Zone E-Waste Collection Queue</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lots.map((lot) => (
              <div
                key={lot.id}
                onClick={() => setSelectedLot(lot)}
                style={{
                  background: selectedLot?.id === lot.id ? '#f1f5f9' : '#ffffff',
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer',
                  border: selectedLot?.id === lot.id ? '1px solid #10b981' : '1px solid var(--border-color)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{lot.lot_code}</div>
                  <span className="badge badge-amber">{lot.status.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>{lot.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{lot.pickup_address}</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>₹ {lot.agreed_purchase_price || lot.ai_estimated_min_value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Automated Unit Economics & Collector Dispatch */}
        {selectedLot && economics && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={20} className="text-emerald-400" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Unit Economics & Profit Optimizer</h2>
              </div>
              <span className="badge badge-emerald">{economics.profitMargin}% Net Margin</span>
            </div>

            <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 16 }}>
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

            {/* Smart Collector Matching & Dispatch Section */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={16} className="text-cyan-400" />
                <span>Recommended Field Collectors (Ranked by Multi-Criteria AI)</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Ramesh Babu (Auto-Rickshaw)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distance: 2.4 km • Completion: 98.5% • Rating: 4.9 ★</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDispatchCollector(selectedLot.id, 'usr-collection_collector-001', 'Ramesh Babu')}
                    disabled={isDispatching}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    <Send size={14} />
                    <span>Dispatch Agent</span>
                  </button>
                </div>

                <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Suresh Scrap Runner (Mini-Truck)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distance: 4.8 km • Completion: 92.0% • Rating: 4.7 ★</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDispatchCollector(selectedLot.id, 'usr-collection_collector-002', 'Suresh Runner')}
                    disabled={isDispatching}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    <Send size={14} />
                    <span>Dispatch Agent</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
