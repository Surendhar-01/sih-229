import React, { useState } from 'react';
import { VernacularLanguage, MatchedRecycler } from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS, MATCHED_RECYCLERS } from './vernacularTranslations';
import { playAudioBeep } from './speechAndAudio';
import {
  MapPin,
  Truck,
  CheckCircle2,
  Navigation,
  Building2,
  Check,
} from 'lucide-react';

interface ScreenRecyclerMatchProps {
  language: VernacularLanguage;
  onAcceptRecycler: (recycler: MatchedRecycler) => void;
}

export const ScreenRecyclerMatch: React.FC<ScreenRecyclerMatchProps> = ({
  language,
  onAcceptRecycler,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];
  const [selectedRecyclerId, setSelectedRecyclerId] = useState<string>('rec-01');

  const selectedRecycler =
    MATCHED_RECYCLERS.find((r) => r.id === selectedRecyclerId) || MATCHED_RECYCLERS[0];

  const handleSelect = (rec: MatchedRecycler) => {
    playAudioBeep(620, 'sine', 60);
    setSelectedRecyclerId(rec.id);
  };

  const handleAccept = () => {
    playAudioBeep(880, 'sine', 140);
    onAcceptRecycler(selectedRecycler);
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none">
      {/* Header */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        <h2 className="text-base font-bold text-gray-800">{t.recyclerMatchTitle}</h2>
        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          GPS Active
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-3 overflow-y-auto">
        {/* Stylized Local Map View */}
        <div className="relative w-full h-44 rounded-2xl bg-[#eef7ee] border border-emerald-200/80 shadow-xs overflow-hidden">
          {/* Street Map Grid Overlay */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(#86efac 1px, transparent 1px), linear-gradient(to right, #86efac 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Road / Transit Vector lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 170">
            <path
              d="M 30 140 L 90 80 L 170 100 L 250 40"
              stroke="#94a3b8"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 30 140 L 90 80 L 170 100 L 250 40"
              stroke="#cbd5e1"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Route dashes */}
            <path
              d="M 90 80 L 170 100"
              stroke="#059669"
              strokeWidth="3"
              strokeDasharray="4 4"
              fill="none"
            />
          </svg>

          {/* Pin 1: Recycler 1 (Green) */}
          <div className="absolute top-8 left-16 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
              <MapPin className="w-4 h-4 fill-white" />
            </div>
          </div>

          {/* Pin 2: Recycler 2 (Deep Red/Amber) */}
          <div className="absolute top-18 right-20 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
              <MapPin className="w-4 h-4 fill-white" />
            </div>
          </div>

          {/* Collector Truck Icon */}
          <div className="absolute top-5 right-6 flex flex-col items-center animate-bounce">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          {/* Live Radius indicator */}
          <div className="absolute bottom-2 left-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-800 border border-emerald-200">
            📍 3 km Field Radius
          </div>
        </div>

        {/* Matched Recycler Cards List */}
        <div className="space-y-2">
          {MATCHED_RECYCLERS.map((rec) => {
            const isSelected = selectedRecyclerId === rec.id;
            return (
              <div
                key={rec.id}
                onClick={() => handleSelect(rec)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                  isSelected
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white/80 border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Left: Name, Distance & Quoted Rate */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">
                      {rec.name[language]}
                    </h3>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {rec.distanceKm} {t.distanceUnit}
                    </span>
                  </div>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-emerald-800 font-mono">
                      ₹{rec.offeredRatePerKg}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      / {t.pricePerKgUnit.replace('₹/', '')}
                    </span>
                  </div>
                </div>

                {/* Right: Badge & Radio Check */}
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rec.badgeType === 'good'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {rec.badge[language]}
                  </span>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Accept Button */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          type="button"
          onClick={handleAccept}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t.acceptBtn}
        </button>
      </div>
    </div>
  );
};
