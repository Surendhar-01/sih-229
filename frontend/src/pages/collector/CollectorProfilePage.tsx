import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  Star,
  Award,
  Scale,
  DollarSign,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const CollectorProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields
  const [area, setArea] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [vehicleType, setVehicleType] = useState('AUTO_RICKSHAW');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/collector/profile');
      if (res.data) {
        setProfile(res.data);
        setArea(res.data.area || 'Central Area');
        setDistrict(res.data.district || 'Mumbai');
        setState(res.data.state || 'Maharashtra');
        setServiceRadius(res.data.service_radius_km || 10);
        setVehicleType(res.data.vehicle_type || 'AUTO_RICKSHAW');
      }
    } catch (err) {
      console.warn('Backend fetch failed, using fallback profile:', err);
      const mock = {
        id: user?.id || 'usr-collector-01',
        full_name: user?.full_name || 'Vikram Shinde',
        phone: user?.phone || '+919876543210',
        area: 'Andheri West',
        district: 'Mumbai',
        state: 'Maharashtra',
        service_radius_km: 12,
        vehicle_type: 'AUTO_RICKSHAW',
        vehicle_registration_no: 'MH-02-BT-4122',
        availability: 'AVAILABLE',
        is_verified: true,
        reliability_score: 96.5,
        rating: 4.9,
        total_pickups_completed: 42,
        total_collected_weight_kg: 520.4,
        total_earnings: 12400.0,
      };
      setProfile(mock);
      setArea(mock.area);
      setDistrict(mock.district);
      setState(mock.state);
      setServiceRadius(mock.service_radius_km);
      setVehicleType(mock.vehicle_type);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch('/collector/profile', {
        area,
        district,
        state,
        service_radius_km: Number(serviceRadius),
        vehicle_type: vehicleType,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading collector profile...</div>;
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 60 }}>
      {/* Back Button */}
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

      {/* Header Profile Card */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: '#ffffff',
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <User size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                {profile?.full_name || 'Field Collector'}
              </h2>
              {profile?.is_verified && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#047857',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={12} /> CPCB Verified
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 2 }}>
              Phone: {profile?.phone || '+919876543210'}
            </div>
          </div>
        </div>

        {/* Read-Only Reliability Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0891b2' }}>
              ★ {profile?.rating || 4.9}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Citizen Rating</div>
          </div>

          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>
              {profile?.reliability_score || 95}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Reliability Score</div>
          </div>

          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#8b5cf6' }}>
              {profile?.total_pickups_completed || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pickups Done</div>
          </div>
        </div>
      </div>

      {/* Editable Field Operations Form */}
      <form
        onSubmit={handleSave}
        className="glass-panel"
        style={{
          padding: '24px',
          background: '#ffffff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
          Operational Preferences (இயக்க அமைப்புகள்)
        </h3>

        {saveSuccess && (
          <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: 8, fontSize: '0.82rem', marginBottom: 16 }}>
            ✓ Profile preferences updated successfully!
          </div>
        )}

        {/* Operating Area */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            Operating Area (பணி செய்யும் பகுதி)
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        {/* District & State */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              District
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Service Radius */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            Service Radius (சேவை வரம்பு): {serviceRadius} KM
          </label>
          <input
            type="range"
            min="2"
            max="30"
            step="1"
            value={serviceRadius}
            onChange={(e) => setServiceRadius(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0891b2' }}
          />
        </div>

        {/* Vehicle Type */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            Vehicle Type (வாகனம்)
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="AUTO_RICKSHAW">Auto-Rickshaw (Medium Payload ~50kg)</option>
            <option value="MINI_TRUCK">Mini Truck / Cargo Van (Large Payload ~300kg)</option>
            <option value="MOTORCYCLE">Motorcycle with Pannier (~25kg)</option>
            <option value="BICYCLE">Bicycle with Carrier (~15kg)</option>
            <option value="ON_FOOT">On-Foot Local Cart</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Save size={16} />
          <span>{saving ? 'Saving Preferences...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
};
