import React, { useState } from 'react';
import {
  VernacularLanguage,
  ScrapCategoryKey,
} from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS } from './vernacularTranslations';
import { speakVernacularText, playAudioBeep } from './speechAndAudio';
import {
  Camera,
  Volume2,
  CheckCircle2,
  XCircle,
  Scan,
  ShoppingBag,
  Package,
} from 'lucide-react';

interface ScreenLotCreationProps {
  language: VernacularLanguage;
  selectedCategory: ScrapCategoryKey;
  weightKg: number;
  setWeightKg: (w: number) => void;
  onSubmitLot: () => void;
}

export const ScreenLotCreation: React.FC<ScreenLotCreationProps> = ({
  language,
  selectedCategory,
  weightKg,
  setWeightKg,
  onSubmitLot,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Audio readout for current weight
  const handleReadWeight = () => {
    playAudioBeep(700, 'sine', 60);
    const weightSpeech =
      language === 'hi'
        ? `चुना गया वजन ${weightKg} किलोग्राम`
        : language === 'mr'
        ? `निवडलेले वजन ${weightKg} किलोग्रॅम`
        : `Selected weight ${weightKg} kilograms`;
    speakVernacularText(weightSpeech, language);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setWeightKg(val);
  };

  const handleCreateLot = () => {
    playAudioBeep(880, 'sine', 150);
    setShowSuccessToast(true);
    speakVernacularText(t.lotCreatedToast, language);
    setTimeout(() => {
      setShowSuccessToast(false);
      onSubmitLot();
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none">
      {/* Header */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        <h2 className="text-base font-bold text-gray-800">{t.createLotTitle}</h2>
        <button
          type="button"
          onClick={() => {
            setIsCameraActive(!isCameraActive);
            playAudioBeep(550, 'sine', 50);
          }}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          title="Camera Viewfinder"
        >
          <Camera className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-4 overflow-y-auto">
        {/* Camera Viewfinder with Object Detection Overlay */}
        <div className="relative w-full aspect-square max-h-[220px] rounded-2xl bg-[#1e2922] border-2 border-emerald-900/40 shadow-inner overflow-hidden flex items-center justify-center">
          {/* Subtle grid pattern for camera sensor preview */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle, #34d399 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Animated Scanning Laser Line */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Corner Viewfinder Marks */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />

          {/* Real-time Bounding Box 1: PCB */}
          <div className="absolute top-6 left-6 w-28 h-18 border-2 border-emerald-400 rounded bg-emerald-500/10 flex flex-col justify-between p-1 shadow-xs">
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs w-fit">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              {t.detectedPcb}
            </span>
          </div>

          {/* Real-time Bounding Box 2: Cable */}
          <div className="absolute bottom-6 left-16 w-24 h-16 border-2 border-emerald-400 rounded bg-emerald-500/10 flex flex-col justify-between p-1 shadow-xs">
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs w-fit">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              {t.detectedCable}
            </span>
          </div>

          {/* Real-time Bounding Box 3: Unknown / Unrecognized */}
          <div className="absolute top-10 right-5 w-20 h-20 border-2 border-dashed border-rose-500 rounded bg-rose-500/10 flex flex-col justify-between p-1 shadow-xs">
            <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs w-fit">
              <XCircle className="w-2.5 h-2.5 text-white" />
              {t.detectedUnknown}
            </span>
          </div>
        </div>

        {/* Visual Weight Selector Section */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
          {/* Section Header with Speaker icon */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              {t.weightSelectTitle}
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {weightKg.toFixed(1)} kg
              </span>
            </span>
            <button
              type="button"
              onClick={handleReadWeight}
              className="p-1 rounded-full text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              title="Listen to Weight"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          {/* Visual Milestone Icons: Bucket, Basket, Sack */}
          <div className="flex items-center justify-between px-2 pt-1">
            {/* Bucket: Light (1-5kg) */}
            <button
              type="button"
              onClick={() => {
                setWeightKg(3.5);
                playAudioBeep(500, 'sine', 40);
              }}
              className={`flex flex-col items-center gap-1 transition-transform ${
                weightKg <= 5 ? 'scale-110 text-emerald-700 font-bold' : 'opacity-60 text-gray-500'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg">
                🪣
              </div>
              <span className="text-[10px] text-center">{t.weightBucket}</span>
            </button>

            {/* Basket/Bag: Medium (5-15kg) */}
            <button
              type="button"
              onClick={() => {
                setWeightKg(14.5);
                playAudioBeep(600, 'sine', 40);
              }}
              className={`flex flex-col items-center gap-1 transition-transform ${
                weightKg > 5 && weightKg <= 20
                  ? 'scale-110 text-emerald-700 font-bold'
                  : 'opacity-60 text-gray-500'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">
                🧺
              </div>
              <span className="text-[10px] text-center">{t.weightBasket}</span>
            </button>

            {/* Heavy Sack: Heavy (20-50kg) */}
            <button
              type="button"
              onClick={() => {
                setWeightKg(35.0);
                playAudioBeep(700, 'sine', 40);
              }}
              className={`flex flex-col items-center gap-1 transition-transform ${
                weightKg > 20 ? 'scale-110 text-emerald-700 font-bold' : 'opacity-60 text-gray-500'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-lg">
                🎒
              </div>
              <span className="text-[10px] text-center">{t.weightSack}</span>
            </button>
          </div>

          {/* Interactive Slider Bar */}
          <div className="px-1 pt-1">
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={weightKg}
              onChange={handleSliderChange}
              className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
              <span>1 kg</span>
              <span>25 kg</span>
              <span>50 kg</span>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl text-center shadow-lg animate-bounce flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t.lotCreatedToast}
          </div>
        )}
      </div>

      {/* Bottom Action CTA Button */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          type="button"
          onClick={handleCreateLot}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Scan className="w-4 h-4" />
          {t.submitLotBtn}
        </button>
      </div>
    </div>
  );
};
