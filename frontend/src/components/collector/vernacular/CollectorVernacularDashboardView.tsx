import React, { useState } from 'react';
import {
  VernacularLanguage,
  ScrapCategoryKey,
  ActiveScreenKey,
  MatchedRecycler,
  CommodityPrice,
} from './VernacularTypes';
import { ScreenHome } from './ScreenHome';
import { ScreenLotCreation } from './ScreenLotCreation';
import { ScreenPriceBoard } from './ScreenPriceBoard';
import { ScreenRecyclerMatch } from './ScreenRecyclerMatch';
import { ScreenHandoverReceipt } from './ScreenHandoverReceipt';
import { ScreenEarnings } from './ScreenEarnings';
import { ScreenIVRHelpline } from './ScreenIVRHelpline';
import { ScreenSafetyAdvice } from './ScreenSafetyAdvice';
import { playAudioBeep } from './speechAndAudio';
import {
  Home,
  Scan,
  TrendingUp,
  MapPin,
  FileCheck,
  Wallet,
  Phone,
  ShieldAlert,
  Smartphone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CollectorVernacularDashboardViewProps {
  initialLanguage?: VernacularLanguage;
  isOffline?: boolean;
  onExitVernacularMode?: () => void;
}

export const CollectorVernacularDashboardView: React.FC<CollectorVernacularDashboardViewProps> = ({
  initialLanguage = 'hi',
  isOffline = false,
  onExitVernacularMode,
}) => {
  const [language, setLanguage] = useState<VernacularLanguage>(initialLanguage);
  const [activeScreen, setActiveScreen] = useState<ActiveScreenKey>('home');
  const [offlineState, setOfflineState] = useState<boolean>(isOffline);
  const [selectedCategory, setSelectedCategory] = useState<ScrapCategoryKey>('pcb');
  const [weightKg, setWeightKg] = useState<number>(14.5);
  const [acceptedRecycler, setAcceptedRecycler] = useState<MatchedRecycler | null>(null);

  const screenTabs: { key: ActiveScreenKey; labelHi: string; labelMr: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: 'home', labelHi: 'होम', labelMr: 'मुख्य', labelEn: 'Home', icon: <Home className="w-4 h-4" /> },
    { key: 'lot_creation', labelHi: 'लॉट बनाएं', labelMr: 'लॉट तयार करा', labelEn: 'Lot Intake', icon: <Scan className="w-4 h-4" /> },
    { key: 'price_board', labelHi: 'आज के भाव', labelMr: 'आजचे भाव', labelEn: 'Price Board', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'recycler_match', labelHi: 'रीसाइक्लर', labelMr: 'रीसायकलर', labelEn: 'Recycler Match', icon: <MapPin className="w-4 h-4" /> },
    { key: 'handover', labelHi: 'रसीद (QR)', labelMr: 'पावती (QR)', labelEn: 'Receipt (QR)', icon: <FileCheck className="w-4 h-4" /> },
    { key: 'earnings', labelHi: 'मेरी कमाई', labelMr: 'माझी कमाई', labelEn: 'Earnings', icon: <Wallet className="w-4 h-4" /> },
    { key: 'ivr_helpline', labelHi: 'हेल्पलाइन', labelMr: 'हेल्पलाइन', labelEn: 'IVR Helpline', icon: <Phone className="w-4 h-4" /> },
    { key: 'safety', labelHi: 'सुरक्षा सलाह', labelMr: 'सुरक्षा सल्ला', labelEn: 'Safety Advice', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const getTabLabel = (tab: (typeof screenTabs)[0]) => {
    if (language === 'mr') return tab.labelMr;
    if (language === 'en') return tab.labelEn;
    return tab.labelHi;
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <ScreenHome
            language={language}
            setLanguage={setLanguage}
            isOffline={offlineState}
            setIsOffline={setOfflineState}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setActiveScreen('lot_creation');
            }}
            onNavigateToLotCreation={() => setActiveScreen('lot_creation')}
          />
        );
      case 'lot_creation':
        return (
          <ScreenLotCreation
            language={language}
            selectedCategory={selectedCategory}
            weightKg={weightKg}
            setWeightKg={setWeightKg}
            onSubmitLot={() => setActiveScreen('recycler_match')}
          />
        );
      case 'price_board':
        return (
          <ScreenPriceBoard
            language={language}
            onSelectPriceItem={(item: CommodityPrice) => {
              setSelectedCategory(item.key);
              setActiveScreen('lot_creation');
            }}
          />
        );
      case 'recycler_match':
        return (
          <ScreenRecyclerMatch
            language={language}
            onAcceptRecycler={(rec) => {
              setAcceptedRecycler(rec);
              setActiveScreen('handover');
            }}
          />
        );
      case 'handover':
        return (
          <ScreenHandoverReceipt
            language={language}
            receipt={{
              lotId: '#SC-4821',
              weightKg: weightKg,
              priceTotal: Math.round(weightKg * 112),
            }}
            onNewHandover={() => setActiveScreen('home')}
          />
        );
      case 'earnings':
        return <ScreenEarnings language={language} />;
      case 'ivr_helpline':
        return <ScreenIVRHelpline language={language} />;
      case 'safety':
        return <ScreenSafetyAdvice language={language} />;
    }
  };

  return (
    <div className="w-full bg-[#f8f6f0] rounded-3xl border border-emerald-900/10 shadow-sm p-4 sm:p-6 mb-8">
      {/* Top Banner & Language Pill Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-700/20">
            📱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-gray-900 leading-none">
                {language === 'hi'
                  ? 'कबाड़ी साथी (Vernacular Field Interface)'
                  : language === 'mr'
                  ? 'कबाडी साथी (Vernacular Field Interface)'
                  : 'Collector Sathi (Vernacular Field Interface)'}
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                8 Features
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Low-literacy voice & visual assistance designed for informal ground workers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switch Pills */}
          <div className="flex items-center bg-white p-1 rounded-xl text-xs font-bold border border-gray-200 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setLanguage('hi');
                playAudioBeep(520, 'sine', 40);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
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
                playAudioBeep(520, 'sine', 40);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
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
                playAudioBeep(520, 'sine', 40);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
          </div>

          {onExitVernacularMode && (
            <button
              type="button"
              onClick={onExitVernacularMode}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs"
            >
              Standard View
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Screen Tab Navigator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-thin">
        {screenTabs.map((tab) => {
          const isActive = activeScreen === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                playAudioBeep(560, 'sine', 35);
                setActiveScreen(tab.key);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-emerald-700/25 scale-[1.02]'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/90'
              }`}
            >
              {tab.icon}
              <span>{getTabLabel(tab)}</span>
            </button>
          );
        })}
      </div>

      {/* Active Screen Container: Mobile-Optimized Phone Chassis centered */}
      <div className="flex justify-center items-center py-2">
        <div className="w-full max-w-[340px] h-[640px] bg-[#111827] rounded-[44px] p-3 shadow-2xl border-4 border-[#1f2937] flex flex-col relative overflow-hidden">
          {/* Top Speaker & Camera Notch */}
          <div className="w-full flex justify-center items-center py-1 absolute top-2.5 left-0 right-0 z-30 pointer-events-none">
            <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-[#1e293b] border border-[#334155]" />
              <div className="w-8 h-1 bg-[#1e293b] rounded-full" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="w-full h-full bg-[#fbfbf9] rounded-[34px] overflow-hidden flex flex-col pt-5 relative">
            <div className="flex-1 overflow-hidden flex flex-col">
              {renderActiveScreen()}
            </div>

            {/* Bottom In-App Quick Bar */}
            <div className="h-12 bg-white border-t border-gray-100 px-2 flex items-center justify-around z-20 shrink-0">
              {screenTabs.slice(0, 5).map((tab) => {
                const isActive = activeScreen === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      playAudioBeep(520, 'sine', 35);
                      setActiveScreen(tab.key);
                    }}
                    className={`flex flex-col items-center justify-center p-1 transition-colors ${
                      isActive ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-[8px] mt-0.5">{getTabLabel(tab)}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="w-full h-3 bg-transparent flex items-center justify-center pointer-events-none pb-0.5">
              <div className="w-24 h-1 bg-gray-400/60 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
