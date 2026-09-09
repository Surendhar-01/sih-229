import React, { useState } from 'react';
import { Camera, X, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Volume2, ShieldAlert } from 'lucide-react';
import { apiClient } from '../services/api';
import { AudioPriceButton } from './AudioPriceButton';

interface AiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLotCreated: () => void;
}

export const AiScannerModal: React.FC<AiScannerModalProps> = ({ isOpen, onClose, onLotCreated }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [condition, setCondition] = useState<string>('INTACT');
  const [address, setAddress] = useState('Flat 402, Green Valley Apartments, Andheri West, Mumbai');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);

  if (!isOpen) return null;

  const handleSimulateScan = async (sampleHint: string, catId: number) => {
    setScanning(true);
    setScanResult(null);
    try {
      const response: any = await apiClient.post('/lots/ai-scan', {
        user_hints: sampleHint,
      });
      const data = response?.data || response;
      setScanResult(data);
      setSelectedCategory(catId);
    } catch (err: any) {
      alert(`AI Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCreateLot = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/lots', {
        category_id: selectedCategory,
        condition,
        pickup_address: address,
        pickup_pincode: '400053',
        latitude: 19.1363,
        longitude: 72.8277,
        estimated_weight_kg: scanResult?.estimated_weight_range?.max_kg || 18.5,
        ai_estimated_min_value: scanResult?.estimated_value_range?.min_inr || 350.0,
        ai_estimated_max_value: scanResult?.estimated_value_range?.max_inr || 480.0,
        description: `Scanned item: ${scanResult?.subcategory || 'E-waste item'} (${condition})`,
      });
      alert('Pickup request created successfully! Assigned to local scrap aggregator.');
      onLotCreated();
      onClose();
    } catch (err: any) {
      alert(`Failed to create lot: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          background: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>AI E-Waste Vision Scanner</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Instant Identification, Fair Valuation & Safety Warnings</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scan Actions or Sample Selector */}
        {!scanResult && !scanning && (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 16 }}>
              Select an electronic waste item to run the AI recognition & valuation pipeline:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => handleSimulateScan('Old CRT Television', 1)}
                className="btn-secondary"
                style={{ flexDirection: 'column', padding: '14px', height: 'auto', textAlign: 'center' }}
              >
                <span style={{ fontSize: '1.6rem', marginBottom: 4 }}>📺</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Old CRT Television</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Hazardous Glass & Lead</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateScan('Desktop Motherboards & PCB', 3)}
                className="btn-secondary"
                style={{ flexDirection: 'column', padding: '14px', height: 'auto', textAlign: 'center' }}
              >
                <span style={{ fontSize: '1.6rem', marginBottom: 4 }}>🖥️</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Circuit Boards (PCB)</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>High Copper/Gold Value</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateScan('Lithium Battery Cells', 4)}
                className="btn-secondary"
                style={{ flexDirection: 'column', padding: '14px', height: 'auto', textAlign: 'center' }}
              >
                <span style={{ fontSize: '1.6rem', marginBottom: 4 }}>🔋</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Lithium-Ion Batteries</span>
                <span style={{ fontSize: '0.7rem', color: '#fb7185' }}>Thermal Hazard Warning</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateScan('Copper Wiring Harness', 5)}
                className="btn-secondary"
                style={{ flexDirection: 'column', padding: '14px', height: 'auto', textAlign: 'center' }}
              >
                <span style={{ fontSize: '1.6rem', marginBottom: 4 }}>🔌</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cables & Wiring</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>High Copper Purity</span>
              </button>
            </div>
          </div>
        )}

        {/* Scanning Spinner */}
        {scanning && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <RefreshCw size={36} className="text-emerald-400" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Analyzing E-Waste via Python AI Microservice...</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Running MobileNetV3 taxonomy classification & LME commodity spot regression
            </div>
          </div>
        )}

        {/* Scan Results Display */}
        {scanResult && (
          <div>
            <div style={{ background: '#090d16', borderRadius: 10, padding: 16, border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <span className="badge badge-emerald">AI Recognition: {Math.round(scanResult.confidence * 100)}% Match</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>{scanResult.subcategory || scanResult.material_category}</h3>
                </div>
                <AudioPriceButton
                  categoryName={scanResult.subcategory || scanResult.material_category}
                  minPrice={scanResult.estimated_value_range?.min_inr || 350}
                  maxPrice={scanResult.estimated_value_range?.max_inr || 480}
                />
              </div>

              {/* Price Range & Weight Range */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estimated Market Payout</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                    ₹ {scanResult.estimated_value_range?.min_inr} – ₹ {scanResult.estimated_value_range?.max_inr}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dynamic spot price estimate</div>
                </div>

                <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estimated Unit Mass</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                    {scanResult.estimated_weight_range?.min_kg} – {scanResult.estimated_weight_range?.max_kg} kg
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Subject to physical scale weighing</div>
                </div>
              </div>

              {/* Hazardous Materials Alert */}
              {scanResult.toxic_elements_detected?.length > 0 && (
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: 10, borderRadius: 8, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} className="text-rose-400" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                    <div style={{ fontWeight: 700 }}>Hazardous Toxic Elements Detected:</div>
                    <div>{scanResult.toxic_elements_detected.join(' • ')}</div>
                    <div style={{ marginTop: 2, color: '#fecdd3' }}>Do NOT dismantle, burn, or crush manually. Keep intact for authorized collection.</div>
                  </div>
                </div>
              )}

              {/* Manual Category Override */}
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsManualOverride(!isManualOverride)}
                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isManualOverride ? 'Hide Category Override' : 'AI result is incorrect? Correct category manually'}
                </button>

                {isManualOverride && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>Select Verified Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, background: '#1e293b', color: '#fff', border: '1px solid var(--border-color)' }}
                    >
                      <option value={1}>CRT Monitors & TVs (CEEW1)</option>
                      <option value={2}>LCD/LED Flat Displays (CEEW1)</option>
                      <option value={3}>Circuit Boards & Motherboards (ITEW1)</option>
                      <option value={4}>Lithium & Acid Batteries (ITEW2)</option>
                      <option value={5}>Cables & Wiring (ITEW1)</option>
                      <option value={6}>Cooling Appliances / Compressors (CEEW2)</option>
                      <option value={7}>Mixed Electronics Plastics (CEEW1)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Condition & Pickup Address Form */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: '#cbd5e1' }}>Item Physical Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#090d16', color: '#fff', border: '1px solid var(--border-color)' }}
              >
                <option value="INTACT">INTACT (Complete assembly, unbroken glass/seal)</option>
                <option value="PARTIAL_DISASSEMBLED">PARTIAL DISASSEMBLED (Some components removed)</option>
                <option value="DAMAGED_CRUSHED">DAMAGED / CRUSHED (Cracked casing or swollen cells)</option>
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: '#cbd5e1' }}>Pickup Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#090d16', color: '#fff', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Rescan Item
              </button>
              <button
                type="button"
                onClick={handleCreateLot}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                <CheckCircle size={16} />
                <span>{isSubmitting ? 'Scheduling...' : 'Confirm & Request Pickup'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
