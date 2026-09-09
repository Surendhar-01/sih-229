export interface LotDraft {
  id: string;
  created_at: string;
  updated_at: string;
  sync_status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  last_sync_error?: string;
  category_id?: number;
  category_name?: string;
  material_id?: number;
  material_name?: string;
  description?: string;
  condition: string;
  quantity: number;
  estimated_weight_kg: number;
  weight_unit: string;
  pickup_address: string;
  city: string;
  district: string;
  state: string;
  pickup_pincode: string;
  latitude: number;
  longitude: number;
  ai_category?: string;
  ai_subcategory?: string;
  ai_confidence?: number;
  user_confirmed_category?: string;
  estimated_min_value?: number;
  estimated_max_value?: number;
  estimated_value?: number;
  valuation_currency?: string;
  images: Array<{
    image_url: string;
    original_filename?: string;
    file_size?: number;
    mime_type?: string;
    is_primary?: boolean;
  }>;
}

const STORAGE_KEY = 'ewaste_platform_lot_drafts';

export const offlineStorage = {
  getDrafts(): LotDraft[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read drafts from localStorage', err);
      return [];
    }
  },

  getDraft(id: string): LotDraft | null {
    const drafts = this.getDrafts();
    return drafts.find((d) => d.id === id) || null;
  },

  saveDraft(draft: Partial<LotDraft> & { id?: string }): LotDraft {
    const drafts = this.getDrafts();
    const nowIso = new Date().toISOString();
    const id = draft.id || `draft-${Date.now()}`;

    const existingIndex = drafts.findIndex((d) => d.id === id);
    const fullDraft: LotDraft = {
      id,
      created_at: existingIndex >= 0 ? drafts[existingIndex].created_at : nowIso,
      updated_at: nowIso,
      sync_status: draft.sync_status || 'PENDING_SYNC',
      category_id: draft.category_id,
      category_name: draft.category_name,
      material_id: draft.material_id,
      material_name: draft.material_name,
      description: draft.description || '',
      condition: draft.condition || 'WORKING',
      quantity: draft.quantity || 1,
      estimated_weight_kg: draft.estimated_weight_kg || 1.0,
      weight_unit: draft.weight_unit || 'kg',
      pickup_address: draft.pickup_address || '',
      city: draft.city || 'Mumbai',
      district: draft.district || 'Mumbai Suburban',
      state: draft.state || 'Maharashtra',
      pickup_pincode: draft.pickup_pincode || '',
      latitude: draft.latitude || 19.0760,
      longitude: draft.longitude || 72.8777,
      ai_category: draft.ai_category,
      ai_subcategory: draft.ai_subcategory,
      ai_confidence: draft.ai_confidence,
      user_confirmed_category: draft.user_confirmed_category,
      estimated_min_value: draft.estimated_min_value,
      estimated_max_value: draft.estimated_max_value,
      estimated_value: draft.estimated_value,
      valuation_currency: draft.valuation_currency || 'INR',
      images: draft.images || [],
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = fullDraft;
    } else {
      drafts.unshift(fullDraft);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch (err) {
      console.error('Failed to save draft to localStorage', err);
    }

    return fullDraft;
  },

  deleteDraft(id: string): void {
    const drafts = this.getDrafts().filter((d) => d.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch (err) {
      console.error('Failed to remove draft from localStorage', err);
    }
  },

  markDraftSynced(id: string): void {
    const drafts = this.getDrafts();
    const draft = drafts.find((d) => d.id === id);
    if (draft) {
      draft.sync_status = 'SYNCED';
      draft.updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    }
  },

  markDraftFailed(id: string, errorMessage: string): void {
    const drafts = this.getDrafts();
    const draft = drafts.find((d) => d.id === id);
    if (draft) {
      draft.sync_status = 'FAILED';
      draft.last_sync_error = errorMessage;
      draft.updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    }
  },

  async syncAllPending(
    submitFn: (draft: LotDraft) => Promise<any>
  ): Promise<{ synced: number; failed: number }> {
    const drafts = this.getDrafts();
    const pending = drafts.filter((d) => d.sync_status === 'PENDING_SYNC' || d.sync_status === 'FAILED');

    let synced = 0;
    let failed = 0;

    for (const draft of pending) {
      try {
        await submitFn(draft);
        this.markDraftSynced(draft.id);
        synced++;
      } catch (err: any) {
        this.markDraftFailed(draft.id, err.message || 'Sync failed');
        failed++;
      }
    }

    return { synced, failed };
  },
};
