import React from 'react';
import { VernacularLanguage, DigitalReceipt } from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS } from './vernacularTranslations';
import { playAudioBeep } from './speechAndAudio';
import {
  CheckCircle2,
  Tv,
  MapPin,
  Clock,
  Scale,
  DollarSign,
  QrCode,
  Download,
  Share2,
} from 'lucide-react';

interface ScreenHandoverReceiptProps {
  language: VernacularLanguage;
  receipt?: Partial<DigitalReceipt>;
  onNewHandover?: () => void;
}

export const ScreenHandoverReceipt: React.FC<ScreenHandoverReceiptProps> = ({
  language,
  receipt,
  onNewHandover,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];

  // Default values matching the mockup image exactly
  const r: DigitalReceipt = {
    lotId: receipt?.lotId || '#SC-4821',
    materialName: receipt?.materialName || {
      hi: 'सीआरटी मॉनिटर',
      mr: 'CRT मॉनिटर',
      en: 'CRT Monitor',
    },
    materialKey: receipt?.materialKey || 'crt',
    weightKg: receipt?.weightKg || 14.5,
    priceTotal: receipt?.priceTotal || 1624,
    timeFormatted: receipt?.timeFormatted || '4:12 PM',
    locationName: receipt?.locationName || 'Pinned',
    isCertified: receipt?.isCertified ?? true,
    qrPayload:
      receipt?.qrPayload ||
      'E-WASTE-HANDOVER:SC-4821|WEIGHT:14.5KG|AMOUNT:1624|HASH:9b8f21e0|GOV:CPCB-OK',
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none">
      {/* Header */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        <h2 className="text-base font-bold text-gray-800">{t.handoverReceiptTitle}</h2>
        <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          {r.lotId}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-4 py-4 gap-4 overflow-y-auto">
        {/* Perforated Receipt Ticket Card */}
        <div className="relative bg-white rounded-2xl border border-gray-200/90 shadow-sm p-4 flex flex-col gap-3.5">
          {/* Subtle top sawtooth/perforation dots */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
            <span className="text-xs font-semibold text-gray-500">
              {t.lotIdLabel}
            </span>
            <span className="text-sm font-extrabold text-gray-900 font-mono">
              {r.lotId}
            </span>
          </div>

          {/* Material row */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              {t.materialLabel}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Tv className="w-5 h-5 text-sky-700" />
            </div>
          </div>

          {/* Weight row */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              {t.weightLabel}
            </span>
            <span className="text-sm font-bold text-gray-800 font-mono">
              {r.weightKg.toFixed(1)} kg
            </span>
          </div>

          {/* Price row */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              {t.priceLabel}
            </span>
            <span className="text-base font-extrabold text-emerald-800 font-mono">
              ₹{r.priceTotal.toLocaleString()}
            </span>
          </div>

          {/* Time row */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              {t.timeLabel}
            </span>
            <span className="text-xs font-semibold text-gray-700 font-mono">
              {r.timeFormatted}
            </span>
          </div>

          {/* Location row */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              {t.locationLabel}
            </span>
            <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
              <span className="text-rose-600">📍</span>
              {r.locationName}
            </span>
          </div>
        </div>

        {/* QR Code Digital Manifest Box */}
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          {/* Authentic SVG QR Pattern Simulation */}
          <div className="w-32 h-32 p-2 bg-white rounded-xl border border-gray-300 shadow-inner flex items-center justify-center relative">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Corner 1 */}
              <rect x="5" y="5" width="26" height="26" fill="none" stroke="#111827" strokeWidth="4" />
              <rect x="12" y="12" width="12" height="12" fill="#111827" />

              {/* Corner 2 */}
              <rect x="69" y="5" width="26" height="26" fill="none" stroke="#111827" strokeWidth="4" />
              <rect x="76" y="12" width="12" height="12" fill="#111827" />

              {/* Corner 3 */}
              <rect x="5" y="69" width="26" height="26" fill="none" stroke="#111827" strokeWidth="4" />
              <rect x="12" y="76" width="12" height="12" fill="#111827" />

              {/* Matrix blocks pattern */}
              <rect x="36" y="10" width="6" height="6" fill="#111827" />
              <rect x="46" y="16" width="8" height="6" fill="#111827" />
              <rect x="58" y="8" width="6" height="6" fill="#111827" />
              <rect x="10" y="36" width="6" height="8" fill="#111827" />
              <rect x="22" y="44" width="8" height="6" fill="#111827" />
              <rect x="36" y="36" width="12" height="12" fill="#111827" />
              <rect x="54" y="36" width="8" height="8" fill="#111827" />
              <rect x="68" y="42" width="6" height="8" fill="#111827" />
              <rect x="80" y="36" width="8" height="8" fill="#111827" />
              <rect x="36" y="54" width="8" height="6" fill="#111827" />
              <rect x="48" y="52" width="12" height="8" fill="#111827" />
              <rect x="68" y="56" width="6" height="12" fill="#111827" />
              <rect x="80" y="54" width="8" height="8" fill="#111827" />
              <rect x="36" y="68" width="8" height="12" fill="#111827" />
              <rect x="50" y="72" width="14" height="6" fill="#111827" />
              <rect x="70" y="74" width="10" height="10" fill="#111827" />
              <rect x="86" y="68" width="6" height="12" fill="#111827" />
              <rect x="44" y="84" width="8" height="8" fill="#111827" />
              <rect x="58" y="84" width="8" height="6" fill="#111827" />
            </svg>
          </div>
        </div>

        {/* Certified Badge / Stamp */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 py-2.5 px-4 rounded-xl shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
          <span>{t.certifiedStamp}</span>
        </div>
      </div>
    </div>
  );
};
