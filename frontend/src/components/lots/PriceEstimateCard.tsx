import React from 'react';
import { IndianRupee, TrendingUp, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PriceEstimateCardProps {
  minValue: number;
  maxValue: number;
  currency?: string;
  categoryName?: string;
  condition?: string;
  loading?: boolean;
}

export const PriceEstimateCard: React.FC<PriceEstimateCardProps> = ({
  minValue,
  maxValue,
  currency = 'INR',
  categoryName,
  condition,
  loading = false,
}) => {
  const { t } = useTranslation();
  const avgValue = Math.round((minValue + maxValue) / 2);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 p-5 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {t('lot.priceEstimateTitle')}
            </h4>
            <p className="text-xs text-slate-400">
              AI Market Intelligence based on current formal e-waste trade benchmark
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Fair Payout Guarantee</span>
        </div>
      </div>

      {/* Main Value Range Display */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Expected Payout Range</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
            <span className="text-emerald-400">₹{minValue.toLocaleString()}</span>
            <span className="text-slate-500 text-lg font-normal">&ndash;</span>
            <span className="text-emerald-400">₹{maxValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-right sm:self-center">
          <div className="text-xs text-slate-400">Indicative Midpoint</div>
          <div className="text-base font-bold text-white">~ ₹{avgValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Clear Transparent Disclaimers */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Estimate Disclaimer: </strong>
          {t('lot.priceDisclaimer')}
        </p>
      </div>

      {/* Security & Direct Payout Note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Direct UPI / Bank transfer immediately upon runner verification & OTP confirmation.</span>
      </div>
    </div>
  );
};
