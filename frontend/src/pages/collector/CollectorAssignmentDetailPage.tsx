import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { offlineStorage } from '../../lib/offlineStorage';
import {
  ChevronLeft,
  Package,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  XCircle,
  Scale,
  Camera,
  AlertTriangle,
  Send,
  Phone,
  ArrowRight,
  ShieldCheck,
  Upload,
  Info,
} from 'lucide-react';

export const CollectorAssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for verification
  const [condition, setCondition] = useState<string>('NON_WORKING');
  const [verifiedWeight, setVerifiedWeight] = useState<string>('6.5');
  const [weighingMethod, setWeighingMethod] = useState<string>('DIGITAL_SCALE');
  const [scaleReference, setScaleReference] = useState<string>('SmartScale-BT04');
  const [verifiedCategory, setVerifiedCategory] = useState<string>('CONSUMER_ELECTRONICS');
  const [collectorNotes, setCollectorNotes] = useState<string>('');
  
  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Too far from current location');

  // Photo uploads
  const [photos, setPhotos] = useState<Array<{ url: string; type: string }>>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Success completed modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get(`/collector/assignments/${assignmentId}`);
      if (res.data) {
        setAssignment(res.data);
        if (res.data.material_lots?.user_confirmed_category) {
          setVerifiedCategory(res.data.material_lots.user_confirmed_category);
        }
        if (res.data.estimated_weight) {
          setVerifiedWeight(String(res.data.estimated_weight));
        }
        // Cache assignment offline
        await offlineStorage.cacheAssignment(res.data);
      }
    } catch (err) {
      console.warn('Backend fetch failed, attempting to read from offline cache:', err);
      const cached = await offlineStorage.getCachedAssignment(assignmentId || '');
      if (cached) {
        setAssignment(cached);
      } else {
        // Fallback demo assignment
        const mock = {
          id: assignmentId,
          assignment_code: 'CA-2026-000101',
          lot_id: 'lot-demo-01',
          status: 'PENDING',
          estimated_weight: 8.5,
          expected_amount: 450.0,
          collector_earning: 180.0,
          pickup_latitude: 19.1197,
          pickup_longitude: 72.8464,
          material_lots: {
            id: 'lot-demo-01',
            lot_code: 'EW-2026-000101',
            ai_category: 'CONSUMER_ELECTRONICS',
            user_confirmed_category: 'CONSUMER_ELECTRONICS',
            city: 'Andheri West, Mumbai',
            address_line: 'Flat 402, Green Valley Apartments',
            pickup_time_preference: 'Morning (9 AM - 12 PM)',
            user_phone: '+919876543210',
            citizen_name: 'Anita Sharma',
          },
        };
        setAssignment(mock);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [assignmentId]);

  // Geolocation helper
  const getCoordinates = (): Promise<{ latitude?: number; longitude?: number; accuracy?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err.message);
          resolve({});
        },
        { timeout: 5000, enableHighAccuracy: true },
      );
    });
  };

  // 1. Accept Assignment
  const handleAccept = async () => {
    setActionLoading(true);
    try {
      if (navigator.onLine) {
        await apiClient.post(`/collector/assignments/${assignment.id}/accept`);
      } else {
        await offlineStorage.queueOperation({
          operation: 'START_COLLECTION',
          assignment_id: assignment.id,
          payload: {},
        });
      }
      setAssignment((prev: any) => ({ ...prev, status: 'ACCEPTED' }));
    } catch (err: any) {
      alert(`Accept failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Reject Assignment
  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/collector/assignments/${assignment.id}/reject`, {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      navigate('/collector/assignments');
    } catch (err: any) {
      alert(`Reject failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Start Collection (On The Way)
  const handleStart = async () => {
    setActionLoading(true);
    try {
      const coords = await getCoordinates();
      if (navigator.onLine) {
        await apiClient.post(`/collector/assignments/${assignment.id}/start`, coords);
      } else {
        await offlineStorage.queueOperation({
          operation: 'START_COLLECTION',
          assignment_id: assignment.id,
          payload: coords,
        });
      }
      setAssignment((prev: any) => ({ ...prev, status: 'ON_THE_WAY' }));
    } catch (err: any) {
      alert(`Could not start travel: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Mark Arrived
  const handleArrive = async () => {
    setActionLoading(true);
    try {
      const coords = await getCoordinates();
      if (navigator.onLine) {
        await apiClient.post(`/collector/assignments/${assignment.id}/arrive`, coords);
      } else {
        await offlineStorage.queueOperation({
          operation: 'ARRIVED',
          assignment_id: assignment.id,
          payload: coords,
        });
      }
      setAssignment((prev: any) => ({ ...prev, status: 'ARRIVED' }));
    } catch (err: any) {
      alert(`Arrival record failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Simulate / Capture Photo
  const handleAddPhoto = (type: string) => {
    const mockPhoto = {
      url: `https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60`,
      type,
    };
    setPhotos((prev) => [...prev, mockPhoto]);
    setUploadNotice(`Proof photo added for ${type.replace('_', ' ').toLowerCase()}`);
    setTimeout(() => setUploadNotice(null), 3000);
  };

  // 6. Complete Collection
  const handleComplete = async () => {
    if (!verifiedWeight || Number(verifiedWeight) <= 0) {
      alert('Please enter a valid actual scale weight in kg.');
      return;
    }
    setActionLoading(true);
    try {
      const coords = await getCoordinates();
      const payload = {
        verified_weight: Number(verifiedWeight),
        condition,
        notes: collectorNotes,
        proof_storage_path: photos.length > 0 ? photos[0].url : 'collector/proof_placeholder.jpg',
        ...coords,
      };

      if (navigator.onLine) {
        await apiClient.post(`/collector/assignments/${assignment.id}/complete`, payload);
      } else {
        await offlineStorage.queueOperation({
          operation: 'COLLECTION_COMPLETED',
          assignment_id: assignment.id,
          payload,
        });
      }

      setAssignment((prev: any) => ({ ...prev, status: 'COLLECTED' }));
      setShowSuccessModal(true);
    } catch (err: any) {
      alert(`Completion failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Loading field collection flow...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Assignment not found.
        <br />
        <Link to="/collector/assignments">Back to Assignments</Link>
      </div>
    );
  }

  const currentStatus = assignment.status || 'PENDING';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 80 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link
          to="/collector/assignments"
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
          <span>All Dispatches</span>
        </Link>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 12,
            background:
              currentStatus === 'COLLECTED'
                ? '#dcfce7'
                : currentStatus === 'PENDING'
                ? '#fef3c7'
                : '#e0f2fe',
            color:
              currentStatus === 'COLLECTED'
                ? '#15803d'
                : currentStatus === 'PENDING'
                ? '#b45309'
                : '#0369a1',
          }}
        >
          ● {currentStatus}
        </span>
      </div>

      {/* Assignment ID Card */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 20px',
          marginBottom: 16,
          background: '#ffffff',
          borderRadius: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Pickup Code
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              {assignment.assignment_code || assignment.id.slice(0, 14)}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Your Earning</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16a34a' }}>
              ₹{assignment.collector_earning || 250}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={15} color="#0891b2" />
            <span>
              {assignment.material_lots?.address_line || 'Doorstep Pickup'}, {assignment.material_lots?.city || 'Mumbai'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', color: '#64748b' }}>
            <span>📦 Est: ~{assignment.estimated_weight || 5} kg</span>
            <span>📱 User: {assignment.material_lots?.citizen_name || 'Citizen'}</span>
            {assignment.material_lots?.pickup_time_preference && (
              <span>⏰ {assignment.material_lots.pickup_time_preference}</span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: PENDING ACCEPT / REJECT                               */}
      {/* ------------------------------------------------------------- */}
      {currentStatus === 'PENDING' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #fed7aa',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#c2410c', fontWeight: 800, fontSize: '0.95rem' }}>
            <AlertTriangle size={18} />
            <span>New Dispatch Available (புதிய பணி ஒதுக்கீடு)</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 16 }}>
            Informal aggregator has assigned this e-waste pickup to you based on your location and vehicle capacity. Do you accept this task?
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              style={{
                padding: '12px',
                borderRadius: 10,
                border: '1px solid #fca5a5',
                background: '#fff1f2',
                color: '#be123c',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <XCircle size={16} />
              <span>Reject (மறுக்க)</span>
            </button>

            <button
              onClick={handleAccept}
              disabled={actionLoading}
              style={{
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Accept (ஏற்கவும்)</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: ACCEPTED -> START COLLECTION (ON THE WAY)             */}
      {/* ------------------------------------------------------------- */}
      {currentStatus === 'ACCEPTED' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #bae6fd',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Navigation size={26} color="#0891b2" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Ready to Travel (பயணத்தைத் தொடங்கவும்)
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4, marginBottom: 18 }}>
            Pressing Start will record your departure time and GPS coordinates for operational tracking.
          </p>

          <button
            onClick={handleStart}
            disabled={actionLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
            }}
          >
            <Navigation size={18} />
            <span>Start Collection (கிளம்பினேன்)</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: ON_THE_WAY -> MARK ARRIVED                           */}
      {/* ------------------------------------------------------------- */}
      {currentStatus === 'ON_THE_WAY' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ddd6fe',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <MapPin size={26} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Travelling to Citizen Location
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4, marginBottom: 18 }}>
            {assignment.material_lots?.address_line}, {assignment.material_lots?.city}
          </p>

          <button
            onClick={handleArrive}
            disabled={actionLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
            }}
          >
            <CheckCircle2 size={18} />
            <span>I Have Arrived (வந்துவிட்டேன்)</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 4: ARRIVED / MATERIAL_VERIFIED -> WEIGH & PROOFS        */}
      {/* ------------------------------------------------------------- */}
      {(currentStatus === 'ARRIVED' || currentStatus === 'MATERIAL_VERIFIED') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Material & Actual Weight Form */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Scale size={20} color="#0891b2" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Field Verification (பொருள் மற்றும் எடை சரிபார்ப்பு)
              </h3>
            </div>

            {/* AI vs User category comparison */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px',
                fontSize: '0.8rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ color: '#64748b' }}>AI Prediction:</div>
                <div style={{ fontWeight: 700, color: '#0891b2' }}>
                  {assignment.material_lots?.ai_category || 'CONSUMER_ELECTRONICS'}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>User Selection:</div>
                <div style={{ fontWeight: 700, color: '#16a34a' }}>
                  {assignment.material_lots?.user_confirmed_category || 'CONSUMER_ELECTRONICS'}
                </div>
              </div>
            </div>

            {/* Verified Category Selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Collector Verified Category
              </label>
              <select
                value={verifiedCategory}
                onChange={(e) => setVerifiedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="CONSUMER_ELECTRONICS">Consumer Electronics (Laptops, Phones, TVs)</option>
                <option value="IT_TELECOM">IT & Telecommunication Hardware</option>
                <option value="LARGE_APPLIANCES">Large Home Appliances (Refrigerators, ACs)</option>
                <option value="BATTERIES_ACCUMULATORS">Batteries (Li-ion, Lead-acid)</option>
                <option value="MIXED_CIRCUIT_BOARDS">Printed Circuit Boards (PCBs)</option>
              </select>
            </div>

            {/* Item Condition */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Physical Condition (பொருளின் நிலை)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6 }}>
                {['WORKING', 'PARTIALLY_WORKING', 'NON_WORKING', 'DAMAGED'].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: condition === cond ? '2px solid #0891b2' : '1px solid #cbd5e1',
                      background: condition === cond ? 'rgba(6, 182, 212, 0.1)' : '#ffffff',
                      color: condition === cond ? '#0891b2' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {cond.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTUAL MEASURED WEIGHT */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                Actual Measured Weight (உண்மை எடை - KG) *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  step="0.1"
                  value={verifiedWeight}
                  onChange={(e) => setVerifiedWeight(e.target.value)}
                  placeholder="e.g. 6.4"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '2px solid #0891b2',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                />
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: '#f1f5f9',
                    fontWeight: 800,
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  KG
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                User original estimate: {assignment.estimated_weight || 5} kg
              </div>
            </div>

            {/* Scale Method */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Weighing Instrument
              </label>
              <input
                type="text"
                value={scaleReference}
                onChange={(e) => setScaleReference(e.target.value)}
                placeholder="Bluetooth smart scale serial"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Collector Field Notes (குறிப்புகள்)
              </label>
              <textarea
                value={collectorNotes}
                onChange={(e) => setCollectorNotes(e.target.value)}
                placeholder="e.g. Power adapter and original cable included, battery intact."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  resize: 'none',
                }}
              />
            </div>
          </div>

          {/* Photo Capture Section */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={20} color="#0891b2" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Proof Photos (புகைப்படங்கள்)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{photos.length} Captured</span>
            </div>

            {uploadNotice && (
              <div style={{ padding: '8px 12px', background: '#dcfce7', color: '#15803d', borderRadius: 8, fontSize: '0.78rem', marginBottom: 12 }}>
                ✓ {uploadNotice}
              </div>
            )}

            {/* Action buttons to simulate/capture photos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => handleAddPhoto('WEIGHING_SCALE')}
                style={{
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px dashed #0891b2',
                  background: 'rgba(6, 182, 212, 0.06)',
                  color: '#0891b2',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Camera size={15} />
                <span>📷 Scale Weight Proof</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddPhoto('COLLECTION_PROOF')}
                style={{
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px dashed #10b981',
                  background: 'rgba(16, 185, 129, 0.06)',
                  color: '#047857',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Camera size={15} />
                <span>📷 Handover Proof</span>
              </button>
            </div>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                {photos.map((p, idx) => (
                  <div key={idx} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                    <img src={p.url} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLETE COLLECTION BUTTON */}
          <button
            onClick={handleComplete}
            disabled={actionLoading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
            }}
          >
            <CheckCircle2 size={20} />
            <span>Complete Collection (சேகரிப்பை முடிக்க)</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 5: COLLECTED STATE VIEW                                  */}
      {/* ------------------------------------------------------------- */}
      {currentStatus === 'COLLECTED' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #bbf7d0',
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircle2 size={32} color="#16a34a" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
            Collection Completed Successfully!
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 4 }}>
            Verified Weight: <strong>{verifiedWeight} kg</strong> • Status: <strong>COLLECTED</strong>
          </p>

          <div
            style={{
              margin: '20px auto 24px',
              padding: '14px',
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              maxWidth: 320,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
              EARNINGS LEDGER RECORD
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', marginTop: 2 }}>
              +₹{assignment.collector_earning || 250}.00
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
              Status: PENDING (Ready for settlement)
            </div>
          </div>

          <Link
            to="/collector/assignments"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#0891b2',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
            }}
          >
            <span>Return to Assignments Queue</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REJECT ASSIGNMENT MODAL                                       */}
      {/* ------------------------------------------------------------- */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Reject Assignment Reason
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 16 }}>
              Please specify why you are unable to accept this pickup dispatch:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                'Too far from current location',
                'Vehicle breakdown / issue',
                'Currently overloaded with collections',
                'Material handling safety concern',
                'Citizen unavailable at specified window',
              ].map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.82rem',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
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
                onClick={handleReject}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
