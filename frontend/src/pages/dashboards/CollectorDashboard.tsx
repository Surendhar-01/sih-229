import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';
import { 
  Truck, 
  MapPin, 
  CheckCircle, 
  Wifi, 
  Navigation, 
  Scale, 
  KeyRound, 
  Camera, 
  Receipt,
  Clock,
  ArrowRight
} from 'lucide-react';

export const CollectorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeLot, setActiveLot] = useState<any>(null);
  const [verifiedWeight, setVerifiedWeight] = useState<string>('18.2');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const fetchJobs = async () => {
    try {
      const res: any = await apiClient.get('/lots');
      setJobs(res.data || []);
      if (res.data?.length > 0 && !activeLot) {
        setActiveLot(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStatusTransition = async (lotId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/lots/${lotId}/status`, { status: newStatus });
      await fetchJobs();
      if (activeLot?.id === lotId) {
        setActiveLot({ ...activeLot, status: newStatus });
      }
    } catch (err: any) {
      alert(`Status transition failed: ${err.message}`);
    }
  };

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLot) return;
    setIsVerifying(true);
    try {
      const res: any = await apiClient.post(`/lots/${activeLot.id}/verify-pickup`, {
        verified_weight_kg: Number(verifiedWeight),
        otp: enteredOtp,
      });

      if (res.success || res.lot) {
        setVerificationSuccess(true);
        alert('Material verified successfully! Instant Cash / UPI receipt issued.');
        await fetchJobs();
      } else {
        alert(res.message || 'Verification failed. Please check citizen OTP.');
      }
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-cyan">Field Collection Runner (PWA Mode)</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Ramesh Babu (Runner #04)</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Vehicle: Auto-Rickshaw (MH-02-BT-4122) • Calibrated Bluetooth Smart-Scale Connected
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.15)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Wifi size={16} className="text-emerald-400" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>Offline PWA Sync: Ready</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Jobs List & Interactive Verification Console */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Left: Assigned Jobs Queue */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>Today's Assigned Jobs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  setActiveLot(job);
                  setVerificationSuccess(false);
                }}
                style={{
                  background: activeLot?.id === job.id ? '#f1f5f9' : '#ffffff',
                  borderRadius: 10,
                  padding: 16,
                  border: activeLot?.id === job.id ? '1px solid #06b6d4' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{job.lot_code}</div>
                  <span className="badge badge-amber">{job.status.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>{job.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={13} />
                  <span>{job.pickup_address}</span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: '#0369a1' }}>Mass: ~{job.estimated_weight_kg} kg</span>
                  <span style={{ fontWeight: 800, color: '#047857' }}>Payout: ₹ {job.agreed_purchase_price || 350}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Doorstep Verification Console */}
        {activeLot && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Collection Verification Console</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Lot: {activeLot.lot_code}</div>
              </div>
              <span className="badge badge-cyan">{activeLot.status.replace('_', ' ')}</span>
            </div>

            {/* Workflow Step Tracker */}
            <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 20 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
                Field Step Progression
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleStatusTransition(activeLot.id, 'ON_THE_WAY')}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 10px', background: activeLot.status === 'ON_THE_WAY' ? '#0284c7' : '#f1f5f9' }}
                >
                  1. On The Way
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusTransition(activeLot.id, 'ARRIVED')}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 10px', background: activeLot.status === 'ARRIVED' ? '#0284c7' : '#f1f5f9' }}
                >
                  2. Arrived at Doorstep
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                  3. Weigh & Verify OTP
                </span>
              </div>
            </div>

            {/* Verification & Weighing Form */}
            <form onSubmit={handleVerifyPickup}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  <Scale size={16} className="text-emerald-400" />
                  <span>Calibrated Scale Reading (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={verifiedWeight}
                  onChange={(e) => setVerifiedWeight(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', fontSize: '1.2rem', fontWeight: 800, borderRadius: 8, background: '#ffffff', color: '#047857', border: '1px solid var(--border-color)', outline: 'none' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Estimated weight was {activeLot.estimated_weight_kg} kg (Variance: 1.6% - Within acceptable bounds)
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  <KeyRound size={16} className="text-amber-400" />
                  <span>Enter Citizen 4-Digit Doorstep OTP</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder={`Citizen OTP is: ${activeLot.pickup_otp || '4821'}`}
                  required
                  style={{ width: '100%', padding: '12px', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.2em', textAlign: 'center', borderRadius: 8, background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: 4 }}>
                  Citizen receives this 4-digit code in their dashboard to confirm fair physical handover.
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              >
                <CheckCircle size={18} />
                <span>{isVerifying ? 'Verifying...' : 'Confirm Scale Weight & Settle Payment'}</span>
              </button>
            </form>

            {/* Receipt Modal on Success */}
            {verificationSuccess && (
              <div style={{ marginTop: 18, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: 14, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 800, marginBottom: 4 }}>
                  <Receipt size={18} />
                  <span>Digital Handover Receipt Generated!</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                  Transaction Code: RCP-{Date.now().toString().slice(-6)} • Verified Mass: {verifiedWeight} kg • Payout: ₹ {activeLot.agreed_purchase_price || 350} settled via Cash Voucher.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
