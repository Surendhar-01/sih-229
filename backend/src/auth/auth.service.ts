import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { AuditService } from '../audit/audit.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface UserProfileRecord {
  id: string;
  email?: string;
  phone: string;
  full_name: string;
  role: string;
  account_status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'DEACTIVATED';
  preferred_language: string;
  general_location: string;
  business_name?: string;
  vehicle_type?: string;
  cpcb_authorization_number?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory accounts repository for fast testing and dev mode
  private accounts: Map<string, UserProfileRecord> = new Map([
    [
      'usr-user-001',
      {
        id: 'usr-user-001',
        email: 'citizen@ewaste.gov.in',
        phone: '+919876543210',
        full_name: 'Anita Sharma',
        role: 'USER',
        account_status: 'ACTIVE',
        preferred_language: 'en',
        general_location: 'Andheri West, Mumbai',
        is_verified: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    [
      'usr-informal_aggregator-001',
      {
        id: 'usr-informal_aggregator-001',
        email: 'aggregator@ewaste.gov.in',
        phone: '+919876543211',
        full_name: 'Ibrahim Khan',
        business_name: 'Dharavi Central Scrap Godown',
        role: 'INFORMAL_AGGREGATOR',
        account_status: 'ACTIVE',
        preferred_language: 'hi',
        general_location: 'Dharavi Yard 12, Mumbai',
        is_verified: true,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    [
      'usr-collection_collector-001',
      {
        id: 'usr-collection_collector-001',
        email: 'collector@ewaste.gov.in',
        phone: '+919876543212',
        full_name: 'Ramesh Babu',
        vehicle_type: 'AUTO_RICKSHAW',
        role: 'COLLECTION_COLLECTOR',
        account_status: 'ACTIVE',
        preferred_language: 'mr',
        general_location: 'Kurla West, Mumbai',
        is_verified: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    [
      'usr-collection_collector-pending',
      {
        id: 'usr-collection_collector-pending',
        email: 'sunil.collector@ewaste.in',
        phone: '+919876543299',
        full_name: 'Sunil Jadhav',
        vehicle_type: 'BICYCLE',
        role: 'COLLECTION_COLLECTOR',
        account_status: 'PENDING',
        preferred_language: 'mr',
        general_location: 'Dadar, Mumbai',
        is_verified: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    [
      'usr-authorized_recycler-001',
      {
        id: 'usr-authorized_recycler-001',
        email: 'recycler@ewaste.gov.in',
        phone: '+919876543213',
        full_name: 'Rajesh Mehta',
        business_name: 'EcoClean Recyclers Pvt Ltd',
        cpcb_authorization_number: 'CPCB/EW-REG/MH-2023/401',
        role: 'AUTHORIZED_RECYCLER',
        account_status: 'ACTIVE',
        preferred_language: 'en',
        general_location: 'Taloja MIDC, Navi Mumbai',
        is_verified: true,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    [
      'usr-authorized_recycler-pending',
      {
        id: 'usr-authorized_recycler-pending',
        email: 'greenearth@ewaste.in',
        phone: '+919876543288',
        full_name: 'Green Earth Recycling LLP',
        cpcb_authorization_number: 'PENDING-REG-MH-2026/091',
        role: 'AUTHORIZED_RECYCLER',
        account_status: 'PENDING',
        preferred_language: 'en',
        general_location: 'Ambernath MIDC, Thane',
        is_verified: false,
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    [
      'usr-government_admin-001',
      {
        id: 'usr-government_admin-001',
        email: 'admin@ewaste.gov.in',
        phone: '+919876543214',
        full_name: 'CPCB Officer S. K. Verma',
        role: 'GOVERNMENT_ADMIN',
        account_status: 'ACTIVE',
        preferred_language: 'en',
        general_location: 'CPCB Western Regional Directorate, Mumbai',
        is_verified: true,
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(userId: string) {
    if (this.accounts.has(userId)) {
      return this.accounts.get(userId);
    }

    if (this.supabaseService.isConfigured()) {
      const dbProfile = await this.supabaseService.getUserProfile(userId);
      if (dbProfile) return dbProfile;
    }

    // Default fallback
    return {
      id: userId,
      phone: '+919876543210',
      email: 'user@ewaste.gov.in',
      full_name: 'Citizen User',
      role: 'USER',
      account_status: 'ACTIVE',
      preferred_language: 'en',
      general_location: 'India',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.getProfile(userId);
    const updated: UserProfileRecord = {
      ...existing,
      full_name: dto.full_name || existing.full_name,
      preferred_language: dto.preferred_language || existing.preferred_language,
      general_location: dto.general_location || existing.general_location,
      updated_at: new Date().toISOString(),
    };

    this.accounts.set(userId, updated);

    await this.auditService.logEvent({
      actor_id: userId,
      actor_role: existing.role,
      action: 'PROFILE_UPDATED',
      entity_type: 'profiles',
      entity_id: userId,
      new_data: dto as any,
    });

    return updated;
  }

  async registerRequest(dto: RegisterRequestDto) {
    if (dto.role === 'GOVERNMENT_ADMIN') {
      throw new ForbiddenException('Public self-registration as GOVERNMENT_ADMIN is strictly prohibited.');
    }

    const newId = `usr-${Date.now()}`;
    const isCitizen = dto.role === 'USER';
    const status = isCitizen ? 'ACTIVE' : 'PENDING';

    const newRecord: UserProfileRecord = {
      id: newId,
      phone: dto.phone,
      email: dto.email,
      full_name: dto.full_name,
      role: dto.role,
      account_status: status,
      preferred_language: dto.preferred_language || 'en',
      general_location: dto.general_location,
      business_name: dto.business_name,
      vehicle_type: dto.vehicle_type,
      cpcb_authorization_number: dto.cpcb_authorization_number,
      is_verified: isCitizen,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.accounts.set(newId, newRecord);

    await this.auditService.logEvent({
      actor_id: newId,
      actor_role: dto.role,
      action: 'ACCOUNT_REGISTRATION_REQUESTED',
      entity_type: 'profiles',
      entity_id: newId,
      new_data: { role: dto.role, status },
    });

    return {
      success: true,
      message: isCitizen
        ? 'Citizen registration completed successfully.'
        : `Registration submitted for '${dto.role}'. Account status is 'PENDING' awaiting regulatory verification.`,
      profile: newRecord,
      account_status: status,
    };
  }

  async getPendingAccounts() {
    const pending: UserProfileRecord[] = [];
    for (const record of this.accounts.values()) {
      if (record.account_status === 'PENDING') {
        pending.push(record);
      }
    }
    return pending;
  }

  async getAllUsers() {
    return Array.from(this.accounts.values());
  }

  async updateAccountStatus(adminId: string, targetUserId: string, newStatus: any, reason?: string) {
    const account = this.accounts.get(targetUserId);
    if (!account) {
      throw new Error(`Account '${targetUserId}' not found.`);
    }

    const previousStatus = account.account_status;
    account.account_status = newStatus;
    account.is_verified = (newStatus === 'ACTIVE');
    account.updated_at = new Date().toISOString();

    await this.auditService.logEvent({
      actor_id: adminId,
      actor_role: 'GOVERNMENT_ADMIN',
      action: `ACCOUNT_STATUS_CHANGED_TO_${newStatus}`,
      entity_type: 'profiles',
      entity_id: targetUserId,
      old_data: { status: previousStatus },
      new_data: { status: newStatus, reason: reason || 'Administrative review completed' },
    });

    return {
      success: true,
      message: `Account status for ${account.full_name} updated to '${newStatus}'.`,
      account,
    };
  }
}
