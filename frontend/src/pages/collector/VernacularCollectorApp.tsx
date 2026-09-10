import React, { useState } from 'react';
import {
  VernacularLanguage,
  ScrapCategoryKey,
  ActiveScreenKey,
  MatchedRecycler,
  CommodityPrice,
} from '../../components/collector/vernacular/VernacularTypes';
import { ScreenHome } from '../../components/collector/vernacular/ScreenHome';
import { ScreenLotCreation } from '../../components/collector/vernacular/ScreenLotCreation';
import { ScreenPriceBoard } from '../../components/collector/vernacular/ScreenPriceBoard';
import { ScreenRecyclerMatch } from '../../components/collector/vernacular/ScreenRecyclerMatch';
import { ScreenHandoverReceipt } from '../../components/collector/vernacular/ScreenHandoverReceipt';
import { ScreenEarnings } from '../../components/collector/vernacular/ScreenEarnings';
import { ScreenIVRHelpline } from '../../components/collector/vernacular/ScreenIVRHelpline';
import { ScreenSafetyAdvice } from '../../components/collector/vernacular/ScreenSafetyAdvice';
import { playAudioBeep } from '../../components/collector/vernacular/speechAndAudio';
import {
  Smartphone,
  LayoutGrid,
  Globe,
  Wifi,
  WifiOff,
  Home,
  Scan,
  TrendingUp,
  MapPin,
  FileCheck,
  Wallet,
  Phone,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

export const VernacularCollectorApp: React.FC = () => {
  // Global View Controls
  const [viewMode, setViewMode] = useState<'gallery' | 'single'>('gallery');
  const [activeScreen, setActiveScreen] = useState<ActiveScreenKey>('home');
  const [language, setLanguage] = useState<VernacularLanguage>('hi');
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Shared Data State
  const [selectedCategory, setSelectedCategory] = useState<ScrapCategoryKey>('pcb');
  const [weightKg, setWeightKg] = useState<number>(14.5);
  const [acceptedRecycler, setAcceptedRecycler] = useState<MatchedRecycler | null>(null);

  // Tab definitions for Single Phone Mode
  const navTabs: { key: ActiveScreenKey; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { key: 'lot_creation', label: 'Lot', icon: <Scan className="w-4 h-4" /> },
    { key: 'price_board', label: 'Prices', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'recycler_match', label: 'Match', icon: <MapPin className="w-4 h-4" /> },
    { key: 'handover', label: 'Receipt', icon: <FileCheck className="w-4 h-4" /> },
    { key: 'earnings', label: 'Earnings', icon: <Wallet className="w-4 h-4" /> },
    { key: 'ivr_helpline', label: 'Helpline', icon: <Phone className="w-4 h-4" /> },
    { key: 'safety', label: 'Safety', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  // Screen renderer helper
  const renderScreenContent = (screenKey: ActiveScreenKey) => {
    switch (screenKey) {
      case 'home':
        return (
          <ScreenHome
            language={language}
            setLanguage={setLanguage}
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
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

  // Reusable Smartphone Frame Wrapper
  const PhoneChassis: React.FC<{
    children: React.ReactNode;
    label?: string;
    screenKey?: ActiveScreenKey;
    showBottomTabs?: boolean;
  }> = ({ children, label, screenKey, showBottomTabs = false }) => {
    return (
      <div className="flex flex-col items-center">
        {/* Smartphone Outer Shell */}
        <div className="w-[310px] h-[640px] bg-[#111827] rounded-[48px] p-3 shadow-2xl shadow-gray-950/20 border-4 border-[#1f2937] flex flex-col relative overflow-hidden transition-all hover:shadow-emerald-950/20">
          {/* Top Speaker & Camera Notch (Dynamic Island) */}
          <div className="w-full flex justify-center items-center py-1 absolute top-2.5 left-0 right-0 z-30 pointer-events-none">
            <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-[#1e293b] border border-[#334155]" />
              <div className="w-8 h-1 bg-[#1e293b] rounded-full" />
            </div>
          </div>

          {/* Screen Display Container */}
          <div className="w-full h-full bg-[#fbfbf9] rounded-[38px] overflow-hidden flex flex-col pt-5 relative">
            <div className="flex-1 overflow-hidden flex flex-col">{children}</div>

            {/* In-app bottom navigation bar (when in Single Phone Mode) */}
            {showBottomTabs && (
              <div className="h-14 bg-white border-t border-gray-100 px-2 flex items-center justify-around z-20 shrink-0">
                {navTabs.slice(0, 5).map((tab) => {
                  const isActive = activeScreen === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        playAudioBeep(520, 'sine', 40);
                        setActiveScreen(tab.key);
                      }}
                      className={`flex flex-col items-center justify-center p-1 transition-colors ${
                        isActive ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab.icon}
                      <span className="text-[9px] mt-0.5">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bottom Home Indicator Bar */}
            <div className="w-full h-4 bg-transparent flex items-center justify-center pointer-events-none pb-1">
              <div className="w-28 h-1 bg-gray-400/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Label Badge below phone frame (Matching the mockup) */}
        {label && (
          <div className="mt-4 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-xs text-xs font-bold text-gray-800">
            {label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3eee7] text-gray-900 flex flex-col">
      {/* Top Application Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/30">
              🌱
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>ई-कचरा साथी</span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Vernacular Collector App
                </span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Low-literacy, voice-assisted mobile platform for informal waste workers
              </p>
            </div>
          </div>

          {/* Top Actions: Language, Mode Switcher & Offline Status */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold border border-gray-200">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  language === 'mr'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English
              </button>
            </div>

            {/* Offline Simulation Toggle */}
            <button
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isOffline
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4 text-amber-700" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
              <span>{isOffline ? 'ऑफलाइन मोड (IndexedDB)' : 'ऑनलाइन (Connected)'}</span>
            </button>

            {/* View Mode Switcher: Gallery vs Single Phone */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'gallery'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Gallery (8 Screens)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'single'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Interactive Phone</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8">
        {viewMode === 'gallery' ? (
          /* ========================================================= */
          /* Gallery Mode: Exact 8-Screen Replica of the Mockup Image   */
          /* ========================================================= */
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-extrabold text-gray-900">
                Informal Waste Collector Experience (8 Vernacular Screens)
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Complete workflow from voice-directed intake to digital handover & certified receipt. Click any feature or button to test interactively!
              </p>
            </div>

            {/* 8 Phone Frames arranged in responsive grid (matching 4x2 on large screens) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
              {/* Screen 1: Home */}
              <PhoneChassis label="Home" screenKey="home">
                {renderScreenContent('home')}
              </PhoneChassis>

              {/* Screen 2: Lot Creation */}
              <PhoneChassis label="Lot Creation" screenKey="lot_creation">
                {renderScreenContent('lot_creation')}
              </PhoneChassis>

              {/* Screen 3: Price Board */}
              <PhoneChassis label="Price Board" screenKey="price_board">
                {renderScreenContent('price_board')}
              </PhoneChassis>

              {/* Screen 4: Recycler Match */}
              <PhoneChassis label="Recycler Match" screenKey="recycler_match">
                {renderScreenContent('recycler_match')}
              </PhoneChassis>

              {/* Screen 5: Handover */}
              <PhoneChassis label="Handover" screenKey="handover">
                {renderScreenContent('handover')}
              </PhoneChassis>

              {/* Screen 6: Earnings */}
              <PhoneChassis label="Earnings" screenKey="earnings">
                {renderScreenContent('earnings')}
              </PhoneChassis>

              {/* Screen 7: IVR Helpline */}
              <PhoneChassis label="IVR Helpline" screenKey="ivr_helpline">
                {renderScreenContent('ivr_helpline')}
              </PhoneChassis>

              {/* Screen 8: Safety */}
              <PhoneChassis label="Safety" screenKey="safety">
                {renderScreenContent('safety')}
              </PhoneChassis>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* Single Interactive Phone Mode with Screen Switcher Bar    */
          /* ========================================================= */
          <div className="flex flex-col items-center justify-center py-4">
            {/* Screen Switcher Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xl">
              {navTabs.map((tab) => {
                const isCurrent = activeScreen === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      playAudioBeep(520, 'sine', 40);
                      setActiveScreen(tab.key);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Single Interactive Phone */}
            <PhoneChassis
              label={`Active: ${activeScreen.replace('_', ' ').toUpperCase()}`}
              showBottomTabs={true}
            >
              {renderScreenContent(activeScreen)}
            </PhoneChassis>
          </div>
        )}
      </main>
    </div>
  );
};
