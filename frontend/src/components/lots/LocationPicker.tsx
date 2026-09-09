import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  address: string;
  onAddressChange: (addr: string) => void;
  city: string;
  onCityChange: (city: string) => void;
  district: string;
  onDistrictChange: (dist: string) => void;
  state: string;
  onStateChange: (state: string) => void;
  pincode: string;
  onPincodeChange: (pin: string) => void;
  latitude: number;
  longitude: number;
  onCoordsChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  address,
  onAddressChange,
  city,
  onCityChange,
  district,
  onDistrictChange,
  state,
  onStateChange,
  pincode,
  onPincodeChange,
  latitude,
  longitude,
  onCoordsChange,
  disabled = false,
}) => {
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setGpsError(null);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        onCoordsChange(lat, lng);
        setDetectingGps(false);
        setGpsSuccess(true);

        // If city/state are empty, fill default based on common region
        if (!city) onCityChange('Mumbai');
        if (!district) onDistrictChange('Mumbai Suburban');
        if (!state) onStateChange('Maharashtra');
      },
      (err) => {
        setDetectingGps(false);
        // Fallback default coordinates (Mumbai)
        onCoordsChange(19.0760, 72.8777);
        setGpsError('Unable to retrieve precise GPS. Switched to manual address entry.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      {/* Header with GPS Auto Detect Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Pickup Location & Address</h4>
            <p className="text-xs text-slate-400">
              Where should our authorized collection agent arrive to inspect and weigh the lot?
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGpsDetect}
          disabled={disabled || detectingGps}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
        >
          {detectingGps ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{detectingGps ? 'Detecting GPS...' : 'Use Current GPS'}</span>
        </button>
      </div>

      {/* GPS Status feedback */}
      {gpsSuccess && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            GPS coordinates locked: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
          </span>
        </div>
      )}

      {gpsError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Address Fields */}
      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Street Address / Apartment / Landmark *
          </label>
          <input
            type="text"
            required
            disabled={disabled}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Flat 402, Green Valley Apts, MG Road, near Metro Station"
            className="w-full py-2.5 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">City *</label>
            <input
              type="text"
              required
              disabled={disabled}
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">District</label>
            <input
              type="text"
              disabled={disabled}
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
              placeholder="e.g. Mumbai Suburban"
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">State *</label>
            <input
              type="text"
              required
              disabled={disabled}
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              placeholder="e.g. Maharashtra"
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">PIN Code *</label>
            <input
              type="text"
              maxLength={6}
              required
              disabled={disabled}
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 400053"
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
