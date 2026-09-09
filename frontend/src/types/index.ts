export type UserRole =
  | 'USER'
  | 'INFORMAL_AGGREGATOR'
  | 'COLLECTION_COLLECTOR'
  | 'AUTHORIZED_RECYCLER'
  | 'GOVERNMENT_ADMIN';

export type LotStatus =
  | 'CREATED'
  | 'AI_ANALYZED'
  | 'WAITING_FOR_QUOTE'
  | 'AGGREGATOR_REVIEW'
  | 'COLLECTOR_MATCHED'
  | 'COLLECTION_ASSIGNED'
  | 'COLLECTOR_ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'MATERIAL_VERIFIED'
  | 'COLLECTED'
  | 'AT_AGGREGATOR'
  | 'RECYCLER_MATCHED'
  | 'QUOTE_RECEIVED'
  | 'HANDOVER_PENDING'
  | 'HANDOVER_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'DISPUTED'
  | 'FLAGGED'
  | 'FAILED';

export interface UserProfile {
  id: string;
  email?: string;
  phone: string;
  full_name: string;
  role: UserRole;
  preferred_language: string;
  avatar_url?: string;
  is_verified: boolean;
}

export interface MaterialCategory {
  id: number;
  code: string;
  name: string;
  display_names: Record<string, string>;
  is_hazardous: boolean;
  cpcb_schedule_code?: string;
  icon_name?: string;
}

export interface MaterialLot {
  id: string;
  lot_code: string;
  user_id: string;
  category_id: number;
  material_id?: number;
  description?: string;
  condition: string;
  estimated_weight_kg?: number;
  verified_weight_kg?: number;
  pickup_address: string;
  status: LotStatus;
  ai_estimated_min_value?: number;
  ai_estimated_max_value?: number;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
  errors?: string[];
}
