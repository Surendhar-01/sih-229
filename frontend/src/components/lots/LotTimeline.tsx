import React from 'react';
import { CheckCircle2, Clock, Truck, ShieldCheck, XCircle, Sparkles, User, Building } from 'lucide-react';
import { LotTimelineItem } from '../../services/lotsService';

interface LotTimelineProps {
  currentStatus: string;
  timelineEvents?: LotTimelineItem[];
}

export const LotTimeline: React.FC<LotTimelineProps> = ({ currentStatus, timelineEvents = [] }) => {
  const steps = [
    { key: 'LOT_CREATED', label: 'Lot Created', icon: <Clock className="w-4 h-4" /> },
    { key: 'AI_ANALYZED', label: 'AI Analyzed', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'WAITING_FOR_QUOTE', label: 'Waiting for Quote', icon: <Building className="w-4 h-4" /> },
    { key: 'COLLECTOR_ASSIGNED', label: 'Collector Assigned', icon: <Truck className="w-4 h-4" /> },
    { key: 'MATERIAL_VERIFIED', label: 'Verified & Collected', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'SETTLED', label: 'Settled & Recycled', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'LOT_CREATED':
      case 'DRAFT':
        return 0;
      case 'AI_ANALYZED':
        return 1;
      case 'WAITING_FOR_QUOTE':
      case 'AGGREGATOR_REVIEW':
        return 2;
      case 'COLLECTOR_ASSIGNED':
      case 'ON_THE_WAY':
        return 3;
      case 'PICKED_UP':
      case 'MATERIAL_VERIFIED':
        return 4;
      case 'AT_AGGREGATOR':
      case 'IN_TRANSIT_TO_RECYCLER':
      case 'AT_RECYCLER':
      case 'RECYCLED':
      case 'SETTLED':
        return 5;
      case 'CANCELLED':
        return -1;
      default:
        return 2;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-sm font-bold text-white">Traceability & Status Timeline</h4>
        {isCancelled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Clock className="w-3.5 h-3.5" />
            Active Lot
          </span>
        )}
      </div>

      {/* Horizontal Progression Bar (Desktop) */}
      {!isCancelled && (
        <div className="hidden sm:grid grid-cols-6 gap-2 relative">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center text-center relative">
                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                      idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isCurrent
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-lg'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                </div>

                <span
                  className={`text-[11px] mt-2 font-semibold ${
                    isCurrent ? 'text-emerald-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Event Log List */}
      {timelineEvents.length > 0 && (
        <div className="space-y-3 pt-2">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Audit Activity Log
          </h5>
          <div className="space-y-2.5">
            {timelineEvents.map((evt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      {evt.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-0.5 text-xs">{evt.note}</p>
                  {evt.actor && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {evt.actor}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
