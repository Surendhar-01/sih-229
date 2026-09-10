export type VernacularLanguage = 'hi' | 'mr' | 'en';

export type ScrapCategoryKey = 'battery' | 'pcb' | 'cable' | 'crt' | 'motor' | 'mix_plastic';

export interface ScrapCategoryItem {
  key: ScrapCategoryKey;
  label: Record<VernacularLanguage, string>;
  icon: string;
  defaultRate: number; // per kg
  color: string;
  bgLight: string;
}

export interface CommodityPrice {
  key: ScrapCategoryKey;
  name: Record<VernacularLanguage, string>;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  trendPercent: number;
  trendDirection: 'up' | 'down';
  audioText: Record<VernacularLanguage, string>;
}

export interface MatchedRecycler {
  id: string;
  name: Record<VernacularLanguage, string>;
  distanceKm: number;
  offeredRatePerKg: number;
  badge: Record<VernacularLanguage, string>;
  badgeType: 'good' | 'low' | 'neutral';
  address: string;
  lat: number;
  lng: number;
}

export interface DigitalReceipt {
  lotId: string;
  materialName: Record<VernacularLanguage, string>;
  materialKey: ScrapCategoryKey;
  weightKg: number;
  priceTotal: number;
  timeFormatted: string;
  locationName: string;
  isCertified: boolean;
  qrPayload: string;
}

export interface EarningsData {
  todayEarnings: number;
  thisWeekEarnings: number;
  pendingPayout: number;
  smsPreview: {
    sender: string;
    message: Record<VernacularLanguage, string>;
  };
}

export interface SafetyAdviceItem {
  id: string;
  type: 'danger' | 'warning';
  title: Record<VernacularLanguage, string>;
  description: Record<VernacularLanguage, string>;
  icon: 'ban' | 'alert';
}

export type ActiveScreenKey =
  | 'home'
  | 'lot_creation'
  | 'price_board'
  | 'recycler_match'
  | 'handover'
  | 'earnings'
  | 'ivr_helpline'
  | 'safety';
