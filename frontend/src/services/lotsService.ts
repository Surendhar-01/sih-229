import { apiClient } from './api';

export interface MaterialSubcategory {
  id: number;
  code: string;
  name: string;
  display_names?: Record<string, string>;
  base_price_per_kg?: number;
  unit?: string;
  hazardous?: boolean;
}

export interface MaterialCategory {
  id: number;
  code: string;
  name: string;
  display_names: Record<string, string>;
  is_hazardous: boolean;
  icon_name: string;
  description: string;
  subcategories: MaterialSubcategory[];
}

export interface AiClassificationResult {
  material_category: string;
  subcategory?: string;
  confidence: number;
  condition?: string;
  possible_materials?: string[];
  estimated_weight_range?: { min_kg: number; max_kg: number };
  estimated_value_range?: { min_inr: number; max_inr: number };
  safety_warnings?: string[];
  suggested_action?: string;
  source?: string;
}

export interface AiPriceAnalysisResult {
  material: string;
  current_average_price: number;
  suggested_range: { min: number; max: number };
  min_value?: number;
  max_value?: number;
  estimated_value?: number;
  currency?: string;
  market_trend: string;
  seven_day_avg?: number;
  thirty_day_avg?: number;
}

export interface LotImagePayload {
  image_url: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  is_primary?: boolean;
}

export interface CreateLotPayload {
  category_id: number;
  category_name?: string;
  material_id?: number;
  material_name?: string;
  description?: string;
  condition: string;
  quantity?: number;
  estimated_weight_kg?: number;
  weight_unit?: string;
  pickup_address: string;
  city?: string;
  district?: string;
  state?: string;
  pickup_pincode?: string;
  latitude?: number;
  longitude?: number;
  ai_category?: string;
  ai_subcategory?: string;
  ai_confidence?: number;
  user_confirmed_category?: string;
  estimated_min_value?: number;
  estimated_max_value?: number;
  estimated_value?: number;
  valuation_currency?: string;
  images?: LotImagePayload[];
}

export interface LotTimelineItem {
  status: string;
  timestamp: string;
  note: string;
  actor: string;
}

export interface LotItem {
  id: string;
  lot_code: string;
  user_id: string;
  user_name?: string;
  category_id: number;
  category_name?: string;
  material_id?: number;
  material_name?: string;
  description?: string;
  condition: string;
  quantity: number;
  estimated_weight_kg: number;
  weight_unit: string;
  verified_weight_kg?: number;
  pickup_address: string;
  city?: string;
  district?: string;
  state?: string;
  pickup_pincode?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  ai_category?: string;
  ai_subcategory?: string;
  ai_confidence?: number;
  user_confirmed_category?: string;
  estimated_min_value?: number;
  estimated_max_value?: number;
  estimated_value?: number;
  valuation_currency?: string;
  images?: LotImagePayload[];
  timeline?: LotTimelineItem[];
  pickup_otp?: string;
  assigned_collector_name?: string;
  created_at: string;
  updated_at: string;
}

export const lotsService = {
  /**
   * Fetch complete database-driven material categories and subcategories
   */
  async getCategories(): Promise<MaterialCategory[]> {
    const res: any = await apiClient.get('/materials/categories');
    return res.data || res || [];
  },

  /**
   * Run AI scan with image base64 and optional text hints
   */
  async scanWithAi(payload: { image_base64: string; user_hints?: string }): Promise<AiClassificationResult> {
    const res: any = await apiClient.post('/lots/ai-scan', payload);
    return res.data || res;
  },

  /**
   * Run AI price intelligence analysis
   */
  async getPriceAnalysis(payload: {
    material: string;
    condition: string;
    weight_kg?: number;
    quantity?: number;
  }): Promise<AiPriceAnalysisResult> {
    const res: any = await apiClient.post('/ai/price-analysis', payload);
    return res.data || res;
  },

  /**
   * Create a new e-waste lot
   */
  async createLot(lotData: CreateLotPayload): Promise<LotItem> {
    const res: any = await apiClient.post('/lots', lotData);
    return res.data || res;
  },

  /**
   * Fetch current authenticated citizen's lots
   */
  async getMyLots(): Promise<LotItem[]> {
    const res: any = await apiClient.get('/lots/my');
    return res.data || res || [];
  },

  /**
   * Fetch single lot details by ID or lot_code
   */
  async getLotById(id: string): Promise<LotItem> {
    const res: any = await apiClient.get(`/lots/${id}`);
    return res.data || res;
  },

  /**
   * Cancel a lot prior to pickup
   */
  async cancelLot(id: string, reason?: string): Promise<LotItem> {
    const res: any = await apiClient.post(`/lots/${id}/cancel`, { reason: reason || 'Cancelled by citizen' });
    return res.data || res;
  },
};
