import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { 
  Boxes, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Layers, 
  Scale, 
  MapPin, 
  Plus,
  ArrowRight,
  CheckSquare,
  Square
} from 'lucide-react';
import axios from 'axios';

export const AggregatorInventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [consolidating, setConsolidating] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const res = await axios.get('http://localhost:5000/api/v1/aggregator/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Fallback inventory data');
      setInventory([
        {
          id: 'inv-demo-1',
          lot_id: 'b4e6d601-382a-45ea-94db-233bbd571f30',
          verified_weight: 7.8,
          available_weight: 7.8,
          condition: 'PARTIALLY_WORKING',
          inventory_status: 'AVAILABLE',
          storage_location: 'Central Yard - Bay 1',
          material_categories: { name: 'Consumer Electronics & Computing' },
          material_lots: { lot_code: 'EW-2026-000101', description: 'Bulk Consumer Electronics & Mixed E-Waste Lot' },
        },
        {
          id: 'inv-demo-2',
          lot_id: 'b4e6d601-382a-45ea-94db-233bbd571f31',
          verified_weight: 18.5,
          available_weight: 18.5,
          condition: 'INTACT',
          inventory_status: 'AVAILABLE',
          storage_location: 'Central Yard - Bay 2',
          material_categories: { name: 'Consumer Electronics & Computing' },
          material_lots: { lot_code: 'EW-2026-000102', description: 'Old Desktop CPUs and Keyboards' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleToggleSelect = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(i => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleConfirmIntake = async (invId: string) => {
    try {
      const token = accessToken || 'dev-mock-informal_aggregator';
      await axios.post(`http://localhost:5000/api/v1/aggregator/inventory/${invId}/confirm-receipt`, {
        received_condition: 'INTACT',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm intake.');
    }
  };

  const handleConsolidateBatch = async () => {
    if (selectedItemIds.length === 0) {
      alert('Please select at least one inventory lot to consolidate.');
      return;
    }
    try {
      setConsolidating(true);
      const token = accessToken || 'dev-mock-informal_aggregator';
      const res = await axios.post('http://localhost:5000/api/v1/aggregator/recycler-batches', {
        inventory_ids: selectedItemIds,
        material_category_id: 10,
        notes: `Consolidated batch containing ${selectedItemIds.length} yard lots.`,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const batch = res.data.data || res.data;
      navigate(`/aggregator/batches/${batch.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create batch.');
    } finally {
      setConsolidating(false);
    }
  };

  const selectedItems = inventory.filter(i => selectedItemIds.includes(i.id));
  const totalSelectedWeight = selectedItems.reduce((sum, i) => sum + Number(i.available_weight || 0), 0);

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => navigate('/aggregator/dashboard')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              {t('aggregator.inventoryTitle', 'Aggregator Yard Stock & Intake')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Materials collected from citizens and stored in warehouse yard awaiting formal recycler batching
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/aggregator/batches')}>
            View Batches ({inventory.filter(i => i.inventory_status === 'RESERVED_FOR_RECYCLER').length} in batches)
          </button>
          {selectedItemIds.length > 0 && (
            <button className="btn btn-primary" onClick={handleConsolidateBatch} disabled={consolidating}>
              <Layers size={16} />
              <span>Consolidate {selectedItemIds.length} Lots ({totalSelectedWeight.toFixed(1)} kg)</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading yard stock...
        </div>
      ) : inventory.length === 0 ? (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <Boxes size={44} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>Yard Inventory Empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            When field collectors deliver collected lots to your yard, they will appear here for intake and recycler batching.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inventory.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const isAvailable = item.inventory_status === 'AVAILABLE';

            return (
              <div 
                key={item.id} 
                className="glass-panel" 
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--panel-bg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {isAvailable && (
                    <div 
                      style={{ cursor: 'pointer', color: isSelected ? '#3b82f6' : 'var(--text-secondary)' }}
                      onClick={() => handleToggleSelect(item.id)}
                    >
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>{item.material_lots?.lot_code || 'EW-Lot'}</span>
                      <span className={`badge ${item.inventory_status === 'AVAILABLE' ? 'badge-green' : 'badge-purple'}`} style={{ fontSize: '0.75rem' }}>
                        {item.inventory_status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.material_lots?.description || item.material_categories?.name || 'Consumer Electronics'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.verified_weight} kg</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Location: {item.storage_location}</div>
                  </div>

                  {item.inventory_status === 'PENDING_RECEIPT' ? (
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={() => handleConfirmIntake(item.id)}>
                      Confirm Intake
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ Stored in Yard
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
