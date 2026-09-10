import React from 'react';
import { VernacularLanguage, EarningsData } from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS } from './vernacularTranslations';
import { playAudioBeep } from './speechAndAudio';
import {
  Coins,
  Calendar,
  Clock,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface ScreenEarningsProps {
  language: VernacularLanguage;
  data?: Partial<EarningsData>;
}

export const ScreenEarnings: React.FC<ScreenEarningsProps> = ({
  language,
  data,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];

  const earnings: EarningsData = {
    todayEarnings: data?.todayEarnings ?? 470,
    thisWeekEarnings: data?.thisWeekEarnings ?? 5200,
    pendingPayout: data?.pendingPayout ?? 150,
    smsPreview: data?.smsPreview || {
      sender: '1800-XXX-XXXX',
      message: {
        hi: 'Aaj ki kamai: ₹470. Kul is mahine: ₹5,200.',
        mr: 'Aajchi kamai: ₹470. Ekun ya mahinyat: ₹5,200.',
        en: "Today's earning: ₹470. Total this month: ₹5,200.",
      },
    },
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none">
      {/* Header */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        <h2 className="text-base font-bold text-gray-800">{t.earningsTitle}</h2>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Auto Bank Transfer
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-3 overflow-y-auto">
        {/* Card 1: Today's Earnings (Mint Green) */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-50 to-teal-100/60 border border-emerald-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center text-xl shadow-xs">
              💰
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-900/80">
                {t.todayEarnings}
              </p>
              <h3 className="text-xl font-extrabold text-emerald-950 font-mono tracking-tight">
                ₹{earnings.todayEarnings}
              </h3>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
            +18%
          </span>
        </div>

        {/* Card 2: This Week (Soft Blue) */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-sky-50 to-indigo-100/60 border border-sky-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center text-xl shadow-xs">
              🗓️
            </div>
            <div>
              <p className="text-xs font-medium text-sky-900/80">
                {t.thisWeekEarnings}
              </p>
              <h3 className="text-xl font-extrabold text-sky-950 font-mono tracking-tight">
                ₹{earnings.thisWeekEarnings.toLocaleString()}
              </h3>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-full">
            42 Lots
          </span>
        </div>

        {/* Card 3: Pending Payout (Soft Amber) */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-50 to-orange-100/60 border border-amber-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center text-xl shadow-xs">
              ⏳
            </div>
            <div>
              <p className="text-xs font-medium text-amber-900/80">
                {t.pendingPayout}
              </p>
              <h3 className="text-xl font-extrabold text-amber-950 font-mono tracking-tight">
                ₹{earnings.pendingPayout}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            By 8:00 PM
          </span>
        </div>

        {/* Simulated SMS Alert Banner */}
        <div className="rounded-2xl p-3.5 bg-white border border-gray-200 shadow-xs flex flex-col gap-1.5 mt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <span className="text-base">📩</span>
            <span>{t.smsPreviewTitle}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-xs font-mono text-gray-800 leading-relaxed">
            {earnings.smsPreview.message[language]}
          </div>
        </div>
      </div>
    </div>
  );
};
