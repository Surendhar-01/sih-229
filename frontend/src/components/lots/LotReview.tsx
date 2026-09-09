import React, { useState } from 'react';
import { Check, ShieldAlert, ArrowLeft, Send, Save, AlertTriangle, MapPin, Package, Scale, IndianRupee } from 'lucide-react';
import { CompressedImage } from '../../utils/imageCompressor';
import { MaterialCategory, MaterialSubcategory } from '../../services/lotsService';

interface LotReviewProps {
  images: CompressedImage[];
  category?: MaterialCategory;
  subcategory?: MaterialSubcategory;
  condition: string;
  quantity: number;
  weight: number;
  unit: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  minValue: number;
  maxValue: number;
  isHazardous: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const LotReview: React.FC<LotReviewProps> = ({
  images,
  category,
  subcategory,
  condition,
  quantity,
  weight,
  unit,
  address,
  city,
  district,
  state,
  pincode,
  latitude,
  longitude,
  minValue,
  maxValue,
  isHazardous,
  onBack,
  onSaveDraft,
  onSubmit,
  isSubmitting,
}) => {
  const [agreementChecked, setAgreementChecked] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Photo Summary Strip */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Attached Photos ({images.length})
        </h4>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0"
            >
              <img src={img.dataUrl} alt={img.originalName} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 px-1 rounded bg-emerald-600 text-[9px] font-bold text-white">
                  PRIMARY
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Item Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device & Specification */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Device Specification</span>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between border-b border-slate-800/80 py-1.5">
              <span className="text-slate-400">Category</span>
              <span className="font-semibold text-white">{category?.name || 'Consumer Electronics'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 py-1.5">
              <span className="text-slate-400">Item / Material</span>
              <span className="font-semibold text-white">{subcategory?.name || category?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 py-1.5">
              <span className="text-slate-400">Condition</span>
              <span className="font-semibold text-emerald-400 capitalize">
                {condition.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Quantity & Weight</span>
              <span className="font-semibold text-white">
                {quantity} unit(s) &bull; ~{weight} {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Pickup & Valuation */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Pickup & Valuation</span>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between border-b border-slate-800/80 py-1.5">
              <span className="text-slate-400">Estimated Payout</span>
              <span className="font-bold text-emerald-400">
                ₹{minValue.toLocaleString()} &ndash; ₹{maxValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 py-1.5">
              <span className="text-slate-400">Destination</span>
              <span className="text-slate-200">{city}, {state} ({pincode})</span>
            </div>
            <div className="border-b border-slate-800/80 py-1.5">
              <span className="text-slate-400 block text-xs mb-0.5">Address</span>
              <p className="text-xs text-slate-200 line-clamp-2">{address}</p>
            </div>
            <div className="flex justify-between py-1 text-[11px] text-slate-500">
              <span>Coordinates</span>
              <span>{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hazardous Handling Guidance if Applicable */}
      {isHazardous && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Hazardous Waste Regulations (E-Waste Rules 2022)</p>
            <p className="text-amber-200/80">
              This lot contains heavy metals, mercury lamps, or battery chemistries. Keep in a dry location.
              Do not crack screens or puncture casing prior to collection.
            </p>
          </div>
        </div>
      )}

      {/* Citizen Declaration Checkbox */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreementChecked}
            onChange={(e) => setAgreementChecked(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-300 leading-relaxed">
            I confirm that I am the rightful owner or authorized disposer of this equipment. The lot is free of
            biological waste, flammable liquids, or explosive materials. I understand that payment is released
            instantly upon verified physical weight and condition grading by the authorized runner.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Edit
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!agreementChecked || isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting Lot...' : 'Submit E-Waste Lot'}
          </button>
        </div>
      </div>
    </div>
  );
};
