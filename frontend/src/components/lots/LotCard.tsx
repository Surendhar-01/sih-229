import React from 'react';
import { Calendar, MapPin, Scale, Package, ChevronRight, XCircle, Sparkles } from 'lucide-react';
import { LotItem } from '../../services/lotsService';

interface LotCardProps {
  lot: LotItem;
  onView: (id: string) => void;
  onCancel?: (id: string) => void;
}

export const LotCard: React.FC<LotCardProps> = ({ lot, onView, onCancel }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_QUOTE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Waiting for Quote
          </span>
        );
      case 'COLLECTOR_ASSIGNED':
      case 'ON_THE_WAY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Collector Assigned
          </span>
        );
      case 'MATERIAL_VERIFIED':
      case 'PICKED_UP':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Verified & Picked Up
          </span>
        );
      case 'SETTLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Settled / Recycled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const primaryImage =
    lot.images && lot.images.length > 0
      ? lot.images[0].image_url
      : 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60';

  const canCancel =
    lot.status === 'WAITING_FOR_QUOTE' ||
    lot.status === 'AGGREGATOR_REVIEW' ||
    lot.status === 'COLLECTOR_ASSIGNED';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition shadow-md overflow-hidden flex flex-col sm:flex-row gap-4 p-4">
      {/* Thumbnail */}
      <div className="w-full sm:w-36 h-36 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative">
        <img
          src={primaryImage}
          alt={lot.category_name || 'E-waste item'}
          className="w-full h-full object-cover"
        />
        {lot.ai_confidence && lot.ai_confidence > 0.8 && (
          <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-2.5 h-2.5" />
            AI Scanned
          </div>
        )}
      </div>

      {/* Details Area */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Top Bar: Code + Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
              {lot.lot_code}
            </span>
            <div>{getStatusBadge(lot.status)}</div>
          </div>

          {/* Title */}
          <h4 className="text-base font-bold text-white hover:text-emerald-400 transition cursor-pointer" onClick={() => onView(lot.id)}>
            {lot.material_name || lot.category_name || 'General E-Waste'}
          </h4>

          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{lot.description}</p>
        </div>

        {/* Specs Pill Strip */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">{lot.condition.replace(/_/g, ' ').toLowerCase()}</span>
          </div>

          <div className="flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {lot.quantity} unit(s) &bull; ~{lot.estimated_weight_kg} {lot.weight_unit || 'kg'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{lot.city || 'Mumbai'}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(lot.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Bottom Bar: Payout + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Estimated Value
            </span>
            <span className="text-sm font-bold text-emerald-400">
              ₹{lot.estimated_min_value ? lot.estimated_min_value.toLocaleString() : '100'} &ndash; ₹{lot.estimated_max_value ? lot.estimated_max_value.toLocaleString() : '350'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(lot.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={() => onView(lot.id)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
