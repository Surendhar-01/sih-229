import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, AlertCircle, Package, CloudOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LotCard } from '../../components/lots/LotCard';
import { lotsService, LotItem } from '../../services/lotsService';
import { offlineStorage, LotDraft } from '../../utils/offlineStorage';
import { useAuthStore } from '../../store/authStore';

export const MyLotsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isCollectorIntake = user?.role === 'COLLECTION_COLLECTOR';
  const createLotRoute = isCollectorIntake ? '/collector/intake' : '/user/lots/create';
  const lotsListRoute = isCollectorIntake ? '/collector/intake/lots' : '/user/lots';

  const [lots, setLots] = useState<LotItem[]>([]);
  const [drafts, setDrafts] = useState<LotDraft[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [syncingDrafts, setSyncingDrafts] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const fetchLots = async () => {
    setLoading(true);
    try {
      const items = await lotsService.getMyLots();
      setLots(items);
    } catch (err: any) {
      console.error('Failed to fetch user lots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
    setDrafts(offlineStorage.getDrafts());
  }, []);

  const handleSyncDrafts = async () => {
    setSyncingDrafts(true);
    setSyncNotice(null);
    try {
      const result = await offlineStorage.syncAllPending(async (draft) => {
        return lotsService.createLot({
          category_id: draft.category_id || 10,
          category_name: draft.category_name,
          material_id: draft.material_id,
          material_name: draft.material_name,
          description: draft.description,
          condition: draft.condition,
          quantity: draft.quantity,
          estimated_weight_kg: draft.estimated_weight_kg,
          weight_unit: draft.weight_unit,
          pickup_address: draft.pickup_address,
          city: draft.city,
          district: draft.district,
          state: draft.state,
          pickup_pincode: draft.pickup_pincode,
          latitude: draft.latitude,
          longitude: draft.longitude,
          ai_category: draft.ai_category,
          ai_subcategory: draft.ai_subcategory,
          ai_confidence: draft.ai_confidence,
          user_confirmed_category: draft.user_confirmed_category,
          estimated_min_value: draft.estimated_min_value,
          estimated_max_value: draft.estimated_max_value,
          images: draft.images,
        });
      });

      setSyncNotice(`Synchronized ${result.synced} draft(s) successfully.`);
      fetchLots();
      setDrafts(offlineStorage.getDrafts());
    } catch (err: any) {
      setSyncNotice(`Sync error: ${err.message}`);
    } finally {
      setSyncingDrafts(false);
    }
  };

  const handleCancelLot = async (lotId: string) => {
    const reason = window.prompt('Please enter a cancellation reason:');
    if (reason === null) return;

    try {
      await lotsService.cancelLot(lotId, reason || 'Cancelled by citizen');
      fetchLots();
    } catch (err: any) {
      alert(`Failed to cancel lot: ${err.message}`);
    }
  };

  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      lot.lot_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lot.category_name && lot.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lot.material_name && lot.material_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lot.city && lot.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'WAITING' && lot.status === 'WAITING_FOR_QUOTE') ||
      (statusFilter === 'ASSIGNED' && (lot.status === 'COLLECTOR_ASSIGNED' || lot.status === 'ON_THE_WAY')) ||
      (statusFilter === 'VERIFIED' && (lot.status === 'MATERIAL_VERIFIED' || lot.status === 'PICKED_UP')) ||
      (statusFilter === 'CANCELLED' && lot.status === 'CANCELLED');

    return matchesSearch && matchesStatus;
  });

  const pendingDraftCount = drafts.filter((d) => d.sync_status === 'PENDING_SYNC').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {t('nav.myLots')}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage your submitted e-waste pickup requests, live tracking, and digital receipts
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(createLotRoute)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('nav.createLot')}</span>
        </button>
      </div>

      {/* Offline Drafts Alert Bar */}
      {pendingDraftCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-blue-950/40 border border-blue-800 text-blue-200 text-xs">
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              You have <strong>{pendingDraftCount} unsynced draft(s)</strong> stored locally on your device.
            </span>
          </div>
          <button
            type="button"
            disabled={syncingDrafts}
            onClick={handleSyncDrafts}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
          >
            {syncingDrafts ? 'Syncing...' : 'Sync Drafts Now'}
          </button>
        </div>
      )}

      {syncNotice && (
        <div className="p-3 rounded-lg bg-slate-800 text-emerald-400 text-xs flex items-center gap-2">
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by lot code (EW-2026-...), category, or city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All Lots' },
            { key: 'WAITING', label: 'Waiting Quote' },
            { key: 'ASSIGNED', label: 'Collector Assigned' },
            { key: 'VERIFIED', label: 'Verified' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === f.key
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lots List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-sm">Loading your e-waste lots...</p>
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No E-Waste Lots Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You haven't created any e-waste lots matching your current filter. Sell or responsibly
              recycle your old electronics today!
            </p>
          </div>
          <button
            type="button"
          onClick={() => navigate(createLotRoute)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Lot</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLots.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              onView={(id) => navigate(`${lotsListRoute}/${id}`)}
              onCancel={handleCancelLot}
            />
          ))}
        </div>
      )}
    </div>
  );
};
