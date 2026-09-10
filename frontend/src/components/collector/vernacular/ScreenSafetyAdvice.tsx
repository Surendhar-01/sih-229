import React, { useState } from 'react';
import { VernacularLanguage } from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS, SAFETY_ADVICE_ITEMS } from './vernacularTranslations';
import { speakVernacularText, playAudioBeep } from './speechAndAudio';
import { Ban, AlertTriangle, Volume2, ShieldCheck, Flame } from 'lucide-react';

interface ScreenSafetyAdviceProps {
  language: VernacularLanguage;
}

export const ScreenSafetyAdvice: React.FC<ScreenSafetyAdviceProps> = ({
  language,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleListenSafety = () => {
    playAudioBeep(680, 'sine', 80);
    setIsPlayingAudio(true);
    speakVernacularText(t.safetySpeechText, language, () => {
      setIsPlayingAudio(false);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none">
      {/* Header */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        <h2 className="text-base font-bold text-gray-800">{t.safetyTitle}</h2>
        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          CPCB Safe
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-3 overflow-y-auto">
        {/* Red Alert Card: Battery Safety */}
        <div className="rounded-2xl p-4 bg-rose-50/90 border border-rose-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 shadow-xs">
            <Ban className="w-6 h-6 text-rose-600 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-950 leading-tight">
              {SAFETY_ADVICE_ITEMS[0].title[language]}
            </h3>
            <p className="text-[11px] text-rose-800/80 mt-1 leading-snug">
              {SAFETY_ADVICE_ITEMS[0].description[language]}
            </p>
          </div>
        </div>

        {/* Amber Alert Card: CRT Glass Hazard */}
        <div className="rounded-2xl p-4 bg-amber-50/90 border border-amber-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6 text-amber-600 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 leading-tight">
              {SAFETY_ADVICE_ITEMS[1].title[language]}
            </h3>
            <p className="text-[11px] text-amber-800/80 mt-1 leading-snug">
              {SAFETY_ADVICE_ITEMS[1].description[language]}
            </p>
          </div>
        </div>

        {/* Audio Action Button Pill */}
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={handleListenSafety}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 ${
              isPlayingAudio
                ? 'bg-sky-700 text-white animate-pulse'
                : 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
            }`}
          >
            <Volume2 className="w-4 h-4 text-sky-600" />
            <span>{t.listenSafetyBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
