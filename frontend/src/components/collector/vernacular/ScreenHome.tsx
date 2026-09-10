import React, { useState } from 'react';
import {
  VernacularLanguage,
  ScrapCategoryKey,
} from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS, SCRAP_CATEGORIES } from './vernacularTranslations';
import { speakVernacularText, playAudioBeep } from './speechAndAudio';
import {
  Mic,
  BatteryCharging,
  Cpu,
  Cable,
  Tv,
  Cog,
  Recycle,
  Wifi,
  WifiOff,
  Volume2,
  Sparkles,
} from 'lucide-react';

interface ScreenHomeProps {
  language: VernacularLanguage;
  setLanguage: (lang: VernacularLanguage) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  onSelectCategory: (cat: ScrapCategoryKey) => void;
  onNavigateToLotCreation: () => void;
}

export const ScreenHome: React.FC<ScreenHomeProps> = ({
  language,
  setLanguage,
  isOffline,
  setIsOffline,
  onSelectCategory,
  onNavigateToLotCreation,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);

  // Material icon mapping matching the mockup
  const renderCategoryIcon = (key: ScrapCategoryKey) => {
    switch (key) {
      case 'battery':
        return <BatteryCharging className="w-8 h-8 text-emerald-600" />;
      case 'pcb':
        return <Cpu className="w-8 h-8 text-sky-600" />;
      case 'cable':
        return <Cable className="w-8 h-8 text-emerald-700" />;
      case 'crt':
        return <Tv className="w-8 h-8 text-indigo-600" />;
      case 'motor':
        return <Cog className="w-8 h-8 text-purple-600" />;
      case 'mix_plastic':
        return <Recycle className="w-8 h-8 text-teal-600" />;
    }
  };

  // Voice handler using Web Speech Recognition or simulated speech fallback
  const handleVoiceClick = () => {
    playAudioBeep(600, 'sine', 80);
    setIsListening(true);
    setRecognizedText(null);

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript.toLowerCase();
          setIsListening(false);
          setRecognizedText(speechResult);

          // Auto-match category
          if (speechResult.includes('battery') || speechResult.includes('बैटरी') || speechResult.includes('बॅटरी')) {
            speakVernacularText('बैटरी पहचानी गई', language);
            onSelectCategory('battery');
          } else if (speechResult.includes('pcb') || speechResult.includes('सर्किट')) {
            speakVernacularText('पीसीबी पहचानी गई', language);
            onSelectCategory('pcb');
          } else if (speechResult.includes('cable') || speechResult.includes('केबल') || speechResult.includes('तार')) {
            speakVernacularText('केबल पहचानी गई', language);
            onSelectCategory('cable');
          } else if (speechResult.includes('crt') || speechResult.includes('टीवी') || speechResult.includes('मॉनिटर')) {
            speakVernacularText('सीआरटी पहचानी गई', language);
            onSelectCategory('crt');
          } else {
            speakVernacularText('सामग्री पहचानी गई', language);
          }
        };

        recognition.onerror = () => {
          triggerFallbackSimulation();
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('Speech recognition start failed, using simulation:', err);
      }
    }

    triggerFallbackSimulation();
  };

  const triggerFallbackSimulation = () => {
    setTimeout(() => {
      setIsListening(false);
      const sampleText =
        language === 'hi'
          ? 'केबल और 2 पीसीबी'
          : language === 'mr'
          ? 'केबल आणि 2 पीसीबी'
          : 'Cable and 2 PCBs';
      setRecognizedText(sampleText);
      speakVernacularText(
        language === 'hi' ? 'केबल और पीसीबी पहचाना गया' : language === 'mr' ? 'केबल आणि पीसीबी ओळखले' : 'Cable and PCB identified',
        language
      );
      setTimeout(() => {
        onSelectCategory('cable');
        onNavigateToLotCreation();
      }, 1200);
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none">
      {/* Top Header Bar */}
      <div className="pt-3 pb-2 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        {/* Language Switch Pills */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setLanguage('hi');
              playAudioBeep(520, 'sine', 50);
            }}
            className={`px-2.5 py-1 rounded-full transition-all ${
              language === 'hi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => {
              setLanguage('mr');
              playAudioBeep(520, 'sine', 50);
            }}
            className={`px-2.5 py-1 rounded-full transition-all ${
              language === 'mr'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              playAudioBeep(520, 'sine', 50);
            }}
            className={`px-2.5 py-1 rounded-full transition-all ${
              language === 'en'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            EN
          </button>
        </div>

        {/* Offline Mode Badge */}
        <button
          type="button"
          onClick={() => {
            setIsOffline(!isOffline);
            playAudioBeep(450, 'triangle', 70);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            isOffline
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
          title="Click to toggle Offline/Online simulation"
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.offlineMode}</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.onlineMode}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Voice Hub Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Pulsing Voice Circle Button */}
        <div className="relative flex items-center justify-center my-4">
          {/* Animated ripple rings */}
          <div
            className={`absolute w-36 h-36 rounded-full bg-emerald-200/50 transition-all ${
              isListening ? 'animate-ping duration-1000' : 'animate-pulse'
            }`}
          />
          <div className="absolute w-30 h-30 rounded-full bg-emerald-300/40" />

          {/* Core Green Microphone Button */}
          <button
            type="button"
            onClick={handleVoiceClick}
            className={`relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-600/30 flex items-center justify-center text-white transition-all transform active:scale-95 hover:scale-105 border-4 border-white ${
              isListening ? 'ring-4 ring-emerald-400 scale-105' : ''
            }`}
            aria-label="Voice input"
          >
            <Mic className={`w-11 h-11 ${isListening ? 'animate-bounce' : ''}`} />
          </button>
        </div>

        {/* Instruction Label under microphone */}
        <p className="mt-3 text-sm font-semibold text-gray-700 text-center max-w-[240px] leading-snug">
          {isListening ? (
            <span className="text-emerald-700 font-bold flex items-center justify-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4" />
              {t.voiceListening}
            </span>
          ) : (
            t.voicePrompt
          )}
        </p>

        {recognizedText && (
          <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-fade-in">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {t.voiceIdentified} <strong>{recognizedText}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 6 Category Selection Grid (3 x 2) */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-2.5">
          {SCRAP_CATEGORIES.map((cat) => {
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  playAudioBeep(650, 'sine', 60);
                  onSelectCategory(cat.key);
                  onNavigateToLotCreation();
                }}
                className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all transform active:scale-95 text-center min-h-[92px]"
              >
                <div className="mb-2 transition-transform group-hover:scale-110">
                  {renderCategoryIcon(cat.key)}
                </div>
                <span className="text-xs font-semibold text-gray-700 leading-tight">
                  {cat.label[language]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
