import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Package,
  MapPin,
  Calendar,
  IndianRupee,
  Sparkles,
  XCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { lotsService, LotItem } from '../../services/lotsService';
import { LotTimeline } from '../../components/lots/LotTimeline';
import { useTranslation } from 'react-i18next';

export const LotDetailPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [lot, setLot] = useState<LotItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLot() {
      if (!lotId) return;
      setLoading(true);
      try {
        const data = await lotsService.getLotById(lotId);
        setLot(data);
      } catch (err: any) {
        console.error('Failed to load lot detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLot();
  }, [lotId]);

  const handleCancelLot = async () => {
    if (!lot) return;
    const reason = window.prompt('Please confirm cancellation reason:');
    if (reason === null) return;

    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await lotsService.cancelLot(lot.id, reason || 'Cancelled by citizen');
      setLot(updated);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel lot');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400 text-sm">Loading lot details...</p>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">E-Waste Lot Not Found</h2>
        <p className="text-slate-400 text-sm">The lot you are looking for does not exist or has been removed.</p>
        <button
          type="button"
          onClick={() => navigate('/user/lots')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition"
        >
          Return to My Lots
        </button>
      </div>
    );
  }

  const images = lot.images || [];
  const primaryImgUrl =
    images.length > 0
      ? images[activeImageIndex]?.image_url || images[0].image_url
      : 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60';

  const canCancel =
    lot.status === 'WAITING_FOR_QUOTE' ||
    lot.status === 'AGGREGATOR_REVIEW' ||
    lot.status === 'COLLECTOR_ASSIGNED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => navigate('/user/lots')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Lots
        </button>

        <div className="flex items-center gap-3">
          {canCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelLot}
              className="px-3.5 py-1.5 rounded-lg border border-rose-800 text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel This Lot'}
            </button>
          )}

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wide">
            {lot.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {cancelError && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
          {cancelError}
        </div>
      )}

      {/* Hero Banner: Lot Code & Pickup Verification OTP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Identification */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
          <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">
            National E-Waste Ledger Code
          </span>
          <h1 className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {lot.lot_code}
          </h1>
          <p className="text-emerald-400 font-semibold text-base">
            {lot.material_name || lot.category_name}
          </p>
          <p className="text-xs text-slate-400 max-w-lg">{lot.description}</p>
        </div>

        {/* Right: Secret Pickup OTP Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              Pickup Verification OTP
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="text-center py-2">
            <div className="text-4xl font-extrabold font-mono text-white tracking-widest bg-slate-950/80 py-2 rounded-xl border border-emerald-500/40 shadow-inner">
              {lot.pickup_otp || '4821'}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Share this secret 4-digit OTP with the authorized collection agent <strong>ONLY</strong>{' '}
            after they inspect and weigh your items on their digital scale.
          </p>
        </div>
      </div>

      {/* Main Grid: Gallery & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gallery */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Uploaded Inspection Photos ({images.length})
          </h3>

          <div className="w-full h-72 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
            <img src={primaryImgUrl} alt="E-waste lot" className="w-full h-full object-cover" />
            {lot.ai_confidence && (
              <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-sm text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                AI Vision Confidence: {Math.round(lot.ai_confidence * 100)}%
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                    activeImageIndex === i ? 'border-emerald-500 shadow-md' : 'border-slate-800 opacity-60'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specifications & Valuation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lot Specifications & Valuation
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 text-xs">Material Category</span>
              <span className="font-semibold text-white">{lot.category_name}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 text-xs">Condition Grade</span>
              <span className="font-semibold text-emerald-400 capitalize">
                {lot.condition.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 text-xs">Quantity / Weight</span>
              <span className="font-semibold text-white">
                {lot.quantity} unit(s) &bull; ~{lot.estimated_weight_kg} {lot.weight_unit || 'kg'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 text-xs">Estimated Market Value</span>
              <span className="font-bold text-emerald-400 text-base">
                ₹{lot.estimated_min_value ? lot.estimated_min_value.toLocaleString() : '150'} &ndash; ₹
                {lot.estimated_max_value ? lot.estimated_max_value.toLocaleString() : '400'}
              </span>
            </div>

            <div className="border-b border-slate-800/80 pb-2">
              <span className="text-slate-400 text-xs block mb-1">Pickup Address</span>
              <p className="text-xs text-slate-200">
                {lot.pickup_address}, {lot.city}, {lot.state} - {lot.pickup_pincode}
              </p>
              {lot.latitude && lot.longitude && (
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  GPS: {lot.latitude.toFixed(4)}° N, {lot.longitude.toFixed(4)}° E
                </span>
              )}
            </div>

            <div className="flex justify-between items-center pt-1 text-xs text-slate-400">
              <span>Date Created</span>
              <span>{new Date(lot.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Progress Timeline */}
      <LotTimeline currentStatus={lot.status} timelineEvents={lot.timeline || []} />
    </div>
  );
};
