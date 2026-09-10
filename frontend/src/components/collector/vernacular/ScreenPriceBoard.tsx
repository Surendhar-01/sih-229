import React, { useState } from 'react';
import { VernacularLanguage, CommodityPrice } from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS, COMMODITY_PRICES } from './vernacularTranslations';
import { speakVernacularText, playAudioBeep } from './speechAndAudio';
import {
  Volume2,
  TrendingUp,
  TrendingDown,
  Cpu,
  BatteryCharging,
  Cable,
  Recycle,
  LineChart,
  X,
} from 'lucide-react';

interface ScreenPriceBoardProps {
  language: VernacularLanguage;
  onSelectPriceItem?: (price: CommodityPrice) => void;
}

export const ScreenPriceBoard: React.FC<ScreenPriceBoardProps> = ({
  language,
  onSelectPriceItem,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];
  const [activeSpeechKey, setActiveSpeechKey] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const getCommodityIcon = (key: string) => {
    switch (key) {
      case 'pcb':
        return <Cpu className="w-6 h-6 text-sky-600" />;
      case 'battery':
        return <BatteryCharging className="w-6 h-6 text-emerald-600" />;
      case 'cable':
        return <Cable className="w-6 h-6 text-emerald-700" />;
      case 'mix_plastic':
        return <Recycle className="w-6 h-6 text-teal-600" />;
      default:
        return <Cpu className="w-6 h-6 text-gray-600" />;
    }
  };

  const handleReadPrice = (item: CommodityPrice) => {
    playAudioBeep(650, 'sine', 70);
    setActiveSpeechKey(item.key);
    speakVernacularText(item.audioText[language], language, () => {
      setActiveSpeechKey(null);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none relative">
      {/* Header */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        <h2 className="text-base font-bold text-gray-800">{t.priceBoardTitle}</h2>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Live MSP
        </span>
      </div>

      {/* Commodity Rate Cards List */}
      <div className="flex-1 px-4 py-3 space-y-2.5 overflow-y-auto">
        {COMMODITY_PRICES.map((item) => {
          const isSpeaking = activeSpeechKey === item.key;
          return (
            <div
              key={item.key}
              onClick={() => onSelectPriceItem && onSelectPriceItem(item)}
              className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer ${
                isSpeaking
                  ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-400/20'
                  : 'border-gray-200/80 hover:border-gray-300'
              }`}
            >
              {/* Left: Icon & Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  {getCommodityIcon(item.key)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 leading-tight">
                    {item.name[language]}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5 font-mono">
                    {item.priceRange}
                  </p>
                </div>
              </div>

              {/* Right: Trend Pill & Audio Readout Button */}
              <div className="flex items-center gap-2">
                {/* Trend Percentage Pill */}
                <div
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-bold ${
                    item.trendDirection === 'up'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {item.trendDirection === 'up' ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      <span>▲ {item.trendPercent}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      <span>▼ {item.trendPercent}%</span>
                    </>
                  )}
                </div>

                {/* 🔊 Audio Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReadPrice(item);
                  }}
                  className={`p-2 rounded-full transition-all ${
                    isSpeaking
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                  title="Listen to price rate"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Link: View Price History */}
      <div className="p-3.5 bg-white border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={() => {
            playAudioBeep(520, 'sine', 50);
            setShowHistoryModal(true);
          }}
          className="text-xs font-bold text-sky-600 hover:text-sky-800 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>{t.priceHistoryLink}</span>
        </button>
      </div>

      {/* Interactive Price History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-3 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-4 shadow-2xl border border-gray-200 flex flex-col gap-3 animate-slide-up">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <LineChart className="w-4 h-4 text-emerald-600" />
                <span>30-Day Scrap Price Trend</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Chart Graphic (SVG sparkline) */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>PCB Avg Rate</span>
                <span className="font-bold text-emerald-700">₹110 / kg (+12%)</span>
              </div>
              <svg className="w-full h-24 stroke-emerald-600 fill-none" viewBox="0 0 200 80">
                <path
                  d="M 10 65 Q 40 50, 70 55 T 130 35 T 190 20"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="190" cy="20" r="4" className="fill-emerald-600 stroke-white" />
              </svg>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                <span>Day 1</span>
                <span>Day 15</span>
                <span>Today</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-snug">
              CPCB verified market intelligence ensures you always get above the minimum statutory floor price.
            </p>

            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
