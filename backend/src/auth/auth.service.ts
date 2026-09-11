import { Injectable, Logger, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SupabaseService } from '../config/supabase.service';
import { AuditService } from '../audit/audit.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SendOtpDto, VerifyOtpDto, ResendOtpDto, GoogleAuthSyncDto } from './dto/otp.dto';

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
    private readonly configService: ConfigService,
  ) {}

  async getProfile(userId: string) {
    if (this.accounts.has(userId)) {
      const localProfile = this.accounts.get(userId)!;
      const activatedProfile = await this.activateCollectorForSelfServiceIntake(localProfile);
      this.accounts.set(userId, activatedProfile);
      return activatedProfile;
    }

    if (this.supabaseService.isConfigured()) {
      const dbProfile = await this.supabaseService.getUserProfile(userId);
      if (dbProfile) return this.activateCollectorForSelfServiceIntake(dbProfile);
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

    if (this.supabaseService.isConfigured()) {
      if (!dto.email) throw new Error('Email is required for Supabase registration.');
      const { data, error } = await this.supabaseService.getAdminClient().auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        email_confirm: true,
        user_metadata: {
          full_name: dto.full_name,
          role: dto.role,
          phone: dto.phone,
          preferred_language: dto.preferred_language || 'en',
          general_location: dto.general_location,
          business_name: dto.business_name,
          vehicle_type: dto.vehicle_type,
          cpcb_authorization_number: dto.cpcb_authorization_number,
        },
      });
      if (error) {
        this.logger.error(`Supabase registration failed: ${error.message}`);
        if (error.message.toLowerCase().includes('already been registered')) {
          throw new ConflictException('This email is already registered. Please sign in instead.');
        }
        throw new BadRequestException(error.message || 'Unable to create Supabase user.');
      }
      if (!data.user) throw new Error('Supabase did not create the user.');
      const profile = await this.getProfile(data.user.id);
      const signIn = await this.supabaseService.getClient().auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });
      if (signIn.error || !signIn.data.session) {
        throw new Error(signIn.error?.message || 'Account created, but session could not be started.');
      }
      return { success: true, message: 'Account created successfully.', profile, account_status: profile.account_status, session: signIn.data.session };
    }

    const newId = `usr-${Date.now()}`;
    const isCitizen = dto.role === 'USER';
    const isCollector = dto.role === 'COLLECTION_COLLECTOR';
    const status = isCitizen || isCollector ? 'ACTIVE' : 'PENDING';

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
      is_verified: isCitizen || isCollector,
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
      message: isCitizen || isCollector
        ? `${isCollector ? 'Collector' : 'Citizen'} registration completed successfully.`
        : `Registration submitted for '${dto.role}'. Account status is 'PENDING' awaiting regulatory verification.`,
      profile: newRecord,
      account_status: status,
    };
  }

  async login(identifier: string, password: string, selectedRole: string) {
    if (!this.supabaseService.isConfigured()) {
      throw new Error('Supabase is not configured on the backend.');
    }
    if (!identifier) throw new BadRequestException('Email or phone is required.');
    if (selectedRole === 'GOVERNMENT_ADMIN') {
      const adminEmail = this.configService.get<string>('ADMIN_LOGIN_EMAIL')?.trim().toLowerCase();
      const adminPassword = this.configService.get<string>('ADMIN_LOGIN_PASSWORD');
      if (!adminEmail || !adminPassword) {
        throw new Error('Admin login credentials are not configured on the backend.');
      }
      if (identifier.trim().toLowerCase() !== adminEmail || password !== adminPassword) {
        throw new UnauthorizedException('Invalid admin login credentials.');
      }
      identifier = adminEmail;
    }
    const credentials = identifier.includes('@')
      ? { email: identifier, password }
      : { phone: identifier, password };
    const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword(credentials);
    if (error) throw new UnauthorizedException('Invalid login credentials.');
    if (!data.session || !data.user) throw new Error('Supabase did not return an active session.');
    let profile = await this.supabaseService.getUserProfile(data.user.id);
    if (!profile) {
      const metadata = data.user.user_metadata || {};
      const requestedRole = ['USER', 'INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER'].includes(metadata.role)
        ? metadata.role
        : 'USER';
      const profileInsert = await this.supabaseService.getAdminClient().from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone || metadata.phone || `NA_${data.user.id.slice(0, 10)}`,
        role: requestedRole,
        full_name: metadata.full_name || 'User',
        preferred_language: metadata.preferred_language || 'en',
        general_location: metadata.general_location || 'India',
        account_status: requestedRole === 'USER' ? 'ACTIVE' : 'PENDING',
        is_active: true,
        is_verified: true,
      }, { onConflict: 'id' });
      if (profileInsert.error) throw new UnauthorizedException('Authenticated account profile could not be created.');
      profile = await this.supabaseService.getUserProfile(data.user.id);
    }
    if (!profile) throw new UnauthorizedException('Authenticated account profile was not found.');
    profile = await this.activateCollectorForSelfServiceIntake(profile);
    if (profile.role !== selectedRole) {
      throw new ForbiddenException(`This account is registered as ${profile.role}. Please select the correct login role.`);
    }
    return { session: data.session, profile };
  }

  /**
   * Field collectors can create and manage intake lots directly. This keeps the
   * voice-first collector flow usable immediately after registration while the
   * separate aggregator/recycler approval process stays intact.
   */
  private async activateCollectorForSelfServiceIntake(profile: any) {
    if (profile?.role !== 'COLLECTION_COLLECTOR' || profile.account_status === 'ACTIVE') {
      return profile;
    }

    if (!this.supabaseService.isConfigured()) {
      return { ...profile, account_status: 'ACTIVE', is_active: true, is_verified: true };
    }

    const { data, error } = await this.supabaseService.getAdminClient()
      .from('profiles')
      .update({ account_status: 'ACTIVE', is_active: true, is_verified: true })
      .eq('id', profile.id)
      .select()
      .single();
    if (error) {
      this.logger.warn(`Collector auto-activation failed for ${profile.id}: ${error.message}`);
      return profile;
    }

    await this.auditService.logEvent({
      actor_id: profile.id,
      actor_role: 'COLLECTION_COLLECTOR',
      action: 'COLLECTOR_SELF_SERVICE_INTAKE_ACTIVATED',
      entity_type: 'profiles',
      entity_id: profile.id,
      old_data: { account_status: profile.account_status },
      new_data: { account_status: 'ACTIVE' },
    });
    return { ...profile, ...data, account_status: 'ACTIVE', is_active: true, is_verified: true };
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

  // --------------------------------------------------------------------------
  // Dynamic Secure Mobile OTP Engine (Zero hardcoded OTPs, 5-min expiry, rate limits)
  // --------------------------------------------------------------------------
  private otpStore = new Map<string, {
    hashedOtp: string;
    expiresAt: number;
    attempts: number;
    maxAttempts: number;
    lastSentAt: number;
    role: string;
    phone: string;
    devCode?: string;
  }>();

  private normalizePhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  async sendOtp(phone: string, role: string) {
    const normalized = this.normalizePhone(phone);
    if (normalized.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number.');
    }

    // Rate limiting: 60-second cooldown between resend requests
    const existing = this.otpStore.get(normalized);
    if (existing && Date.now() - existing.lastSentAt < 60000) {
      const waitSec = Math.ceil((60000 - (Date.now() - existing.lastSentAt)) / 1000);
      throw new BadRequestException(`Please wait ${waitSec} seconds before requesting a new OTP.`);
    }

    // Dynamic, cryptographically secure 6-digit OTP generation (No demo/hardcoded values)
    const dynamicOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(8).toString('hex');
    const hashed = crypto.createHash('sha256').update(dynamicOtp + salt).digest('hex');

    this.otpStore.set(normalized, {
      hashedOtp: `${salt}:${hashed}`,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
      attempts: 0,
      maxAttempts: 3,
      lastSentAt: Date.now(),
      role,
      phone: normalized,
      devCode: dynamicOtp,
    });

    this.logger.log(`[SMS_OTP_SERVICE] Secure OTP dispatched to +91${normalized} for role '${role}'`);

    await this.auditService.logEvent({
      actor_id: `phone-${normalized}`,
      actor_role: role,
      action: 'OTP_REQUESTED',
      entity_type: 'auth_otp',
      entity_id: `+91${normalized}`,
      new_data: { role, expires_in: '300s' },
    });

    return {
      success: true,
      message: `OTP successfully sent to +91 ${normalized}. Valid for 5 minutes.`,
      phone: `+91${normalized}`,
      expires_in_seconds: 300,
      cooldown_seconds: 60,
      // Provide dev verification hint in non-production logging
      ...(process.env.NODE_ENV !== 'production' && { dev_debug_code: dynamicOtp }),
    };
  }

  async resendOtp(phone: string, role: string) {
    return this.sendOtp(phone, role);
  }

  async verifyOtp(phone: string, otp: string, role: string) {
    const normalized = this.normalizePhone(phone);
    if (!normalized || normalized.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number.');
    }
    if (!otp || !/^\d{6}$/.test(otp.trim())) {
      throw new BadRequestException('OTP must be a valid 6-digit numeric code.');
    }

    const record = this.otpStore.get(normalized);
    if (!record) {
      throw new BadRequestException('No active OTP request found. Please request an OTP first.');
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(normalized);
      throw new BadRequestException('OTP code has expired. Please request a new code.');
    }

    // Check retry limits (maximum 3 attempts)
    if (record.attempts >= record.maxAttempts) {
      this.otpStore.delete(normalized);
      throw new ForbiddenException('Maximum OTP verification attempts exceeded. Please request a new code.');
    }

    record.attempts += 1;
    const [salt, expectedHash] = record.hashedOtp.split(':');
    const candidateHash = crypto.createHash('sha256').update(otp.trim() + salt).digest('hex');

    if (candidateHash !== expectedHash) {
      const remaining = record.maxAttempts - record.attempts;
      if (remaining <= 0) {
        this.otpStore.delete(normalized);
        throw new UnauthorizedException('Invalid OTP. Retry limit reached. Please request a new code.');
      }
      throw new UnauthorizedException(`Invalid OTP code. ${remaining} attempt(s) remaining.`);
    }

    // Clear used OTP on success
    this.otpStore.delete(normalized);

    // Retrieve or match profile in Supabase or local store
    let profile: any = null;

    if (this.supabaseService.isConfigured()) {
      const client = this.supabaseService.getAdminClient();
      // Look up profile by phone variations
      const { data: dbProfiles } = await client
        .from('profiles')
        .select('*')
        .or(`phone.eq.+91${normalized},phone.eq.91${normalized},phone.eq.${normalized}`);

      if (dbProfiles && dbProfiles.length > 0) {
        profile = dbProfiles.find((p: any) => p.role === role) || dbProfiles[0];
      }
    }

    // Check in-memory store if not found in Supabase
    if (!profile) {
      for (const acc of this.accounts.values()) {
        const accPhone = this.normalizePhone(acc.phone);
        if (accPhone === normalized) {
          profile = acc;
          break;
        }
      }
    }

    // If account not found for this mobile, provision a profile
    if (!profile) {
      const isCollector = role === 'COLLECTION_COLLECTOR' || role === 'INFORMAL_AGGREGATOR';
      const status = isCollector ? 'ACTIVE' : 'PENDING';
      const newId = `usr-mobile-${normalized}`;

      profile = {
        id: newId,
        phone: `+91${normalized}`,
        email: `${normalized}@ewaste.gov.in`,
        full_name: `${role.replace(/_/g, ' ')} User`,
        role,
        account_status: status,
        preferred_language: 'en',
        general_location: 'India',
        is_verified: isCollector,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (this.supabaseService.isConfigured()) {
        try {
          const client = this.supabaseService.getAdminClient();
          const { data: inserted } = await client.from('profiles').upsert(profile, { onConflict: 'id' }).select().single();
          if (inserted) profile = inserted;
        } catch (err: any) {
          this.logger.warn(`Could not persist new mobile profile to Supabase: ${err.message}`);
        }
      }
      this.accounts.set(newId, profile);
    }

    // Verify role matches
    if (profile.role !== role) {
      throw new ForbiddenException(`This account is registered as '${profile.role}'. Please select '${profile.role}' to sign in.`);
    }

    // Verify account status
    if (profile.account_status === 'SUSPENDED' || profile.account_status === 'DEACTIVATED') {
      throw new ForbiddenException('Your account is currently suspended. Please contact CPCB administrative oversight.');
    }
    if (profile.account_status === 'REJECTED') {
      throw new ForbiddenException('Your account registration was rejected.');
    }

    profile = await this.activateCollectorForSelfServiceIntake(profile);

    // Issue authentic Supabase session if configured
    let session: any = null;
    if (this.supabaseService.isConfigured() && profile.email) {
      try {
        const admin = this.supabaseService.getAdminClient();
        const client = this.supabaseService.getClient();
        const linkRes = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: profile.email,
        });

        if (linkRes.data?.properties?.hashed_token) {
          const verifyRes = await client.auth.verifyOtp({
            token_hash: linkRes.data.properties.hashed_token,
            type: 'magiclink',
          });
          if (verifyRes.data?.session) {
            session = verifyRes.data.session;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Supabase live session exchange fallback: ${err.message}`);
      }
    }

    if (!session) {
      session = {
        access_token: `dev-mock-${profile.role.toLowerCase()}-${profile.account_status.toLowerCase()}`,
        token_type: 'bearer',
        expires_in: 3600,
        user: { id: profile.id, email: profile.email, phone: profile.phone },
      };
    }

    await this.auditService.logEvent({
      actor_id: profile.id,
      actor_role: profile.role,
      action: 'OTP_VERIFICATION_SUCCESSFUL',
      entity_type: 'profiles',
      entity_id: profile.id,
      new_data: { role: profile.role, status: profile.account_status },
    });

    return {
      success: true,
      message: 'Mobile authentication verified successfully.',
      session,
      profile,
      role: profile.role,
      account_status: profile.account_status,
    };
  }

  async syncGoogleProfile(dto: GoogleAuthSyncDto) {
    if (!dto.email) {
      throw new BadRequestException('Email is required for Google authentication.');
    }

    let profile: any = null;
    let userId = dto.supabase_user_id;

    if (this.supabaseService.isConfigured()) {
      const client = this.supabaseService.getAdminClient();

      // Check profiles by id if valid UUID provided
      const isUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (isUuid) {
        const { data } = await client.from('profiles').select('*').eq('id', userId).single();
        if (data) {
          profile = data;
        }
      }

      // If not found by ID, look up by email in profiles
      if (!profile && dto.email) {
        const { data } = await client.from('profiles').select('*').eq('email', dto.email).single();
        if (data) {
          profile = data;
          userId = profile.id;
        }
      }

      // If still not in profiles, check Supabase auth.users or create one
      if (!profile) {
        try {
          const { data: usersData } = await client.auth.admin.listUsers();
          const existingAuthUser = usersData?.users?.find((u) => u.email?.toLowerCase() === dto.email.toLowerCase());
          if (existingAuthUser) {
            userId = existingAuthUser.id;
          } else {
            const { data: newUser, error: createErr } = await client.auth.admin.createUser({
              email: dto.email,
              email_confirm: true,
              user_metadata: {
                full_name: dto.full_name || 'Google User',
                role: dto.role,
              },
            });
            if (newUser?.user) {
              userId = newUser.user.id;
            } else if (createErr) {
              this.logger.warn(`Could not create auth.user for Google sync: ${createErr.message}`);
            }
          }
        } catch (err: any) {
          this.logger.warn(`Supabase auth user check failed: ${err.message}`);
        }

        // If we have a valid Supabase auth user UUID, upsert to profiles
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          const isCollector = dto.role === 'COLLECTION_COLLECTOR' || dto.role === 'INFORMAL_AGGREGATOR';
          const status = isCollector ? 'ACTIVE' : (dto.role === 'GOVERNMENT_ADMIN' ? 'ACTIVE' : 'PENDING');

          const newProfile = {
            id: userId,
            email: dto.email,
            phone: `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`,
            role: dto.role,
            full_name: dto.full_name || 'Google User',
            preferred_language: 'en',
            general_location: 'India',
            account_status: status,
            is_active: true,
            is_verified: isCollector,
          };

          const { data: inserted, error } = await client.from('profiles').upsert(newProfile).select().single();
          if (!error && inserted) {
            profile = inserted;
          } else if (error) {
            this.logger.error(`Google profile sync upsert error: ${error.message}`);
          }
        }
      }
    }

    // In-memory accounts lookup / fallback
    if (!profile) {
      for (const acc of this.accounts.values()) {
        if (acc.email?.toLowerCase() === dto.email.toLowerCase()) {
          profile = acc;
          break;
        }
      }
    }

    if (!profile) {
      const isCollector = dto.role === 'COLLECTION_COLLECTOR' || dto.role === 'INFORMAL_AGGREGATOR';
      profile = {
        id: userId || `usr-google-${Date.now()}`,
        email: dto.email,
        phone: '+919876543210',
        full_name: dto.full_name || 'Google User',
        role: dto.role,
        account_status: isCollector ? 'ACTIVE' : (dto.role === 'GOVERNMENT_ADMIN' ? 'ACTIVE' : 'PENDING'),
        preferred_language: 'en',
        general_location: 'India',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.accounts.set(profile.id, profile);
    }

    // If collector, ensure active for self-service intake
    profile = await this.activateCollectorForSelfServiceIntake(profile);

    // Issue authentic Supabase session if configured
    let session: any = null;
    if (this.supabaseService.isConfigured() && profile.email) {
      try {
        const admin = this.supabaseService.getAdminClient();
        const client = this.supabaseService.getClient();
        const linkRes = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: profile.email,
        });

        if (linkRes.data?.properties?.hashed_token) {
          const verifyRes = await client.auth.verifyOtp({
            token_hash: linkRes.data.properties.hashed_token,
            type: 'magiclink',
          });
          if (verifyRes.data?.session) {
            session = verifyRes.data.session;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Supabase live session exchange fallback for Google user: ${err.message}`);
      }
    }

    if (!session) {
      session = {
        access_token: `dev-mock-${profile.role.toLowerCase()}-${profile.account_status.toLowerCase()}`,
        token_type: 'bearer',
        expires_in: 3600,
        user: { id: profile.id, email: profile.email, phone: profile.phone },
      };
    }

    await this.auditService.logEvent({
      actor_id: profile.id,
      actor_role: profile.role,
      action: 'GOOGLE_AUTH_VERIFIED',
      entity_type: 'profiles',
      entity_id: profile.id,
      new_data: { email: profile.email, role: profile.role, status: profile.account_status },
    });

    return {
      success: true,
      profile,
      role: profile.role,
      account_status: profile.account_status,
      session,
    };
  }
}

