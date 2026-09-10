import { apiClient } from './api';

export interface AdminDashboardKpi {
  total_users: number;
  active_collectors: number;
  active_aggregators: number;
  verified_recyclers: number;
  active_lots: number;
  collected_lots: number;
  in_transit_lots: number;
  recycled_lots: number;
  pending_payments: number;
  completed_payments: number;
  total_collected_weight_kg: number;
  total_recycled_weight_kg: number;
  total_disbursed_inr: number;
  open_anomalies_count: number;
  formalization_rate: string;
}

export interface PipelineStageItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  avg_time_hours: number;
  delayed_count: number;
}

export interface AdminDashboardData {
  kpi: AdminDashboardKpi;
  pipeline: PipelineStageItem[];
  timestamp: string;
}

export interface AdminUserItem {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  account_status: string;
  general_location?: string;
  preferred_language?: string;
  created_at: string;
}

export interface AdminAggregatorItem {
  id: string;
  company_name: string;
  facility_address?: string;
  city?: string;
  state?: string;
  verification_status: string;
  compliance_score?: number;
  profile?: {
    full_name: string;
    email: string;
    phone: string;
    account_status: string;
  };
  created_at: string;
}

export interface AdminCollectorItem {
  id: string;
  operating_zone?: string;
  vehicle_type?: string;
  verification_status: string;
  reliability_score?: number;
  profile?: {
    full_name: string;
    email: string;
    phone: string;
    account_status: string;
  };
  created_at: string;
}

export interface AdminRecyclerItem {
  id: string;
  company_name: string;
  facility_address?: string;
  city?: string;
  state?: string;
  cpcb_authorization_number?: string;
  cpcb_valid_upto?: string;
  is_cpcb_authorized: boolean;
  annual_capacity_metric_tons?: number;
  compliance_score?: number;
  verification_status: string;
  is_license_expired?: boolean;
  is_license_expiring_soon?: boolean;
  profile?: {
    full_name: string;
    email: string;
    phone: string;
    account_status: string;
  };
}

export interface AdminLotItem {
  id: string;
  lot_code: string;
  category_id: number;
  category_name?: string;
  material_name?: string;
  condition: string;
  status: string;
  estimated_weight_kg: number;
  verified_weight_kg?: number;
  pickup_address: string;
  city?: string;
  state?: string;
  created_at: string;
  user?: {
    full_name: string;
    phone?: string;
    email?: string;
  };
}

export interface AdminAnomalyItem {
  id: string;
  lot_id?: string;
  risk_level: string;
  detector_type: string;
  reason: string;
  deviation_percentage?: number;
  is_reviewed_by_admin: boolean;
  created_at: string;
  lot?: {
    lot_code: string;
    category_name: string;
  };
}

export interface AdminAlertItem {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export interface AdminComplaintItem {
  id: string;
  issue_type: string;
  status: string;
  description: string;
  priority?: string;
  resolution_notes?: string;
  created_at: string;
  filed_by?: {
    full_name: string;
    role: string;
    phone?: string;
  };
  lot?: {
    lot_code: string;
  };
}

export interface AdminAuditLogItem {
  id: string | number;
  actor_id?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: any;
  new_data?: any;
  created_at: string;
}

export const adminService = {
  async getDashboard(): Promise<AdminDashboardData> {
    const res: any = await apiClient.get('/admin/dashboard');
    return res.data || res;
  },

  async getUsers(params?: { role?: string; status?: string; search?: string }): Promise<AdminUserItem[]> {
    const res: any = await apiClient.get('/admin/users', { params });
    return res.data || res || [];
  },

  async getUserById(id: string): Promise<any> {
    const res: any = await apiClient.get(`/admin/users/${id}`);
    return res.data || res;
  },

  async updateUserStatus(id: string, status: string, reason?: string): Promise<any> {
    const res: any = await apiClient.patch(`/admin/users/${id}/status`, { status, reason });
    return res.data || res;
  },

  async getAggregators(params?: { status?: string; search?: string }): Promise<AdminAggregatorItem[]> {
    const res: any = await apiClient.get('/admin/aggregators', { params });
    return res.data || res || [];
  },

  async getAggregatorById(id: string): Promise<any> {
    const res: any = await apiClient.get(`/admin/aggregators/${id}`);
    return res.data || res;
  },

  async updateAggregatorStatus(id: string, status: string, reason?: string): Promise<any> {
    const res: any = await apiClient.patch(`/admin/aggregators/${id}/status`, { status, reason });
    return res.data || res;
  },

  async getCollectors(params?: { status?: string; search?: string }): Promise<AdminCollectorItem[]> {
    const res: any = await apiClient.get('/admin/collectors', { params });
    return res.data || res || [];
  },

  async getCollectorById(id: string): Promise<any> {
    const res: any = await apiClient.get(`/admin/collectors/${id}`);
    return res.data || res;
  },

  async approveCollector(id: string): Promise<any> {
    const res: any = await apiClient.post(`/admin/collectors/${id}/approve`);
    return res.data || res;
  },

  async rejectCollector(id: string, reason: string): Promise<any> {
    const res: any = await apiClient.post(`/admin/collectors/${id}/reject`, { reason });
    return res.data || res;
  },

  async updateCollectorStatus(id: string, status: string, reason?: string): Promise<any> {
    const res: any = await apiClient.patch(`/admin/collectors/${id}/status`, { status, reason });
    return res.data || res;
  },

  async getRecyclers(params?: { status?: string; search?: string }): Promise<AdminRecyclerItem[]> {
    const res: any = await apiClient.get('/admin/recyclers', { params });
    return res.data || res || [];
  },

  async getRecyclerById(id: string): Promise<any> {
    const res: any = await apiClient.get(`/admin/recyclers/${id}`);
    return res.data || res;
  },

  async verifyRecycler(id: string): Promise<any> {
    const res: any = await apiClient.post(`/admin/recyclers/${id}/verify`);
    return res.data || res;
  },

  async rejectRecycler(id: string, reason: string): Promise<any> {
    const res: any = await apiClient.post(`/admin/recyclers/${id}/reject`, { reason });
    return res.data || res;
  },

  async getApprovals(): Promise<any> {
    const res: any = await apiClient.get('/admin/approvals');
    return res.data || res;
  },

  async getLots(params?: { status?: string; category_id?: number; search?: string }): Promise<AdminLotItem[]> {
    const res: any = await apiClient.get('/admin/lots', { params });
    return res.data || res || [];
  },

  async getLotById(id: string): Promise<any> {
    const res: any = await apiClient.get(`/admin/lots/${id}`);
    return res.data || res;
  },

  async getCollections(status?: string): Promise<any[]> {
    const res: any = await apiClient.get('/admin/collections', { params: { status } });
    return res.data || res || [];
  },

  async getHandovers(status?: string): Promise<any[]> {
    const res: any = await apiClient.get('/admin/handovers', { params: { status } });
    return res.data || res || [];
  },

  async getFinance(): Promise<any> {
    const res: any = await apiClient.get('/admin/finance');
    return res.data || res;
  },

  async getFinanceReconciliation(): Promise<any> {
    const res: any = await apiClient.get('/admin/finance/reconciliation');
    return res.data || res;
  },

  async getComplaints(status?: string): Promise<AdminComplaintItem[]> {
    const res: any = await apiClient.get('/admin/complaints', { params: { status } });
    return res.data || res || [];
  },

  async updateComplaintStatus(id: string, status: string, notes?: string): Promise<any> {
    const res: any = await apiClient.patch(`/admin/complaints/${id}/status`, { status, notes });
    return res.data || res;
  },

  async getAnomalies(riskLevel?: string): Promise<{ anomaly_alerts: AdminAnomalyItem[]; admin_alerts: AdminAlertItem[] }> {
    const res: any = await apiClient.get('/admin/anomalies', { params: { risk_level: riskLevel } });
    return res.data || res || { anomaly_alerts: [], admin_alerts: [] };
  },

  async updateAnomalyStatus(id: string, status: string, action_taken?: string): Promise<any> {
    const res: any = await apiClient.patch(`/admin/anomalies/${id}/status`, { status, action_taken });
    return res.data || res;
  },

  async getMaterialAnalytics(): Promise<any[]> {
    const res: any = await apiClient.get('/admin/analytics/materials');
    return res.data || res || [];
  },

  async getMapData(): Promise<any> {
    const res: any = await apiClient.get('/admin/map');
    return res.data || res;
  },

  async getReports(): Promise<any> {
    const res: any = await apiClient.get('/admin/reports');
    return res.data || res;
  },

  async getAuditLogs(params?: { entity_type?: string; action?: string }): Promise<AdminAuditLogItem[]> {
    const res: any = await apiClient.get('/admin/audit-logs', { params });
    return res.data || res || [];
  },

  async getGlobalSearch(query: string): Promise<any> {
    const res: any = await apiClient.get('/admin/search', { params: { q: query } });
    return res.data || res;
  },
};
