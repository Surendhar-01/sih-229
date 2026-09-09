import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { AiClassificationResult } from '../../services/lotsService';
import { useTranslation } from 'react-i18next';

interface AIAnalysisCardProps {
  aiResult: AiClassificationResult | null;
  analyzing: boolean;
  onConfirmCategory: () => void;
  onChangeCategory: () => void;
  userConfirmedCategory?: string;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  aiResult,
  analyzing,
  onConfirmCategory,
  onChangeCategory,
  userConfirmedCategory,
}) => {
  const { t } = useTranslation();

  if (analyzing) {
    return (
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-5 backdrop-blur-sm animate-pulse">
        <div className="flex items-center gap-3 text-blue-400">
          <Sparkles className="w-5 h-5 animate-spin text-blue-400" />
          <span className="font-semibold text-sm">{t('lot.aiAnalyzing')}</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4 bg-blue-900/40 rounded w-3/4"></div>
          <div className="h-3 bg-blue-900/30 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!aiResult) {
    return null;
  }

  const confidence = aiResult.confidence ?? 0.85;
  const isHigh = confidence >= 0.80;
  const isMedium = confidence >= 0.50 && confidence < 0.80;
  const isLow = confidence < 0.50;

  const confidenceBadge = () => {
    if (isHigh) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t('lot.confidenceHigh')} ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    if (isMedium) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <AlertTriangle className="w-3.5 h-3.5" />
          {t('lot.confidenceMedium')} ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
        <HelpCircle className="w-3.5 h-3.5" />
        {t('lot.confidenceLow')} ({Math.round(confidence * 100)}%)
      </span>
    );
  };

  const displayName = aiResult.subcategory
    ? `${aiResult.material_category.replace(/_/g, ' ')} &bull; ${aiResult.subcategory.replace(/_/g, ' ')}`
    : aiResult.material_category.replace(/_/g, ' ');

  return (
    <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800/80 p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {t('lot.aiIdentified')}
            </h4>
            <p
              className="text-base font-bold text-white capitalize"
              dangerouslySetInnerHTML={{ __html: displayName }}
            />
          </div>
        </div>

        <div>{confidenceBadge()}</div>
      </div>

      {/* Low confidence banner warning */}
      {isLow && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold">Uncertain AI Visual Match</p>
            <p className="text-rose-300/80">
              The camera image did not yield high classification certainty. Please review or manually select the category from the list.
            </p>
          </div>
        </div>
      )}

      {/* Possible Materials & Estimated Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {aiResult.possible_materials && aiResult.possible_materials.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recoverable Components</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiResult.possible_materials.map((mat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-slate-700/80 text-slate-200 text-[11px]"
                >
                  {mat}
                </span>
              ))}
            </div>
          </div>
        )}

        {aiResult.estimated_value_range && (
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <div className="text-slate-400 font-medium mb-1">Estimated Indicative Range</div>
            <div className="text-base font-bold text-emerald-400">
              ₹{aiResult.estimated_value_range.min_inr} &ndash; ₹{aiResult.estimated_value_range.max_inr}
            </div>
            {aiResult.estimated_weight_range && (
              <div className="text-[11px] text-slate-400 mt-1">
                Typical Weight: {aiResult.estimated_weight_range.min_kg} - {aiResult.estimated_weight_range.max_kg} kg
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Directive */}
      {aiResult.safety_warnings && aiResult.safety_warnings.length > 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>{aiResult.safety_warnings[0]}</span>
        </div>
      )}

      {/* Confirmation & Override Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onChangeCategory}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          {t('lot.changeCategory')}
        </button>

        <button
          type="button"
          onClick={onConfirmCategory}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
        >
          <span>{t('lot.confirmCategory')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
