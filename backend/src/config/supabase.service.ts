import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedUserSession {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  account_status: string;
  full_name: string;
  preferred_language: string;
  general_location?: string;
}

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;
  private adminClient: SupabaseClient;
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (
      supabaseUrl &&
      anonKey &&
      !supabaseUrl.includes('dummy') &&
      !anonKey.includes('dummy')
    ) {
      try {
        this.client = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false },
        });

        if (serviceRoleKey && !serviceRoleKey.includes('dummy')) {
          this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
          });
        }
        this.configured = true;
        this.logger.log('Supabase client successfully initialized');
      } catch (err) {
        this.logger.warn(`Failed to initialize Supabase client: ${err.message}`);
      }
    } else {
      this.logger.warn(
        'Supabase credentials not configured or set to placeholder. Using mock/development mode.',
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient || this.client;
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUserSession | null> {
    // 1. Check if token is a dev mock token for local testing
    if (token.startsWith('dev-mock-')) {
      const parts = token.replace('dev-mock-', '').split('-');
      const role = (parts[0] || 'user').toUpperCase();
      const status = (parts[1] || 'active').toUpperCase();

      return {
        id: `usr-${role.toLowerCase()}-001`,
        email: `${role.toLowerCase()}@ewaste.gov.in`,
        phone: '+919876543210',
        role: role === 'INFORMAL_AGGREGATOR' || role === 'COLLECTION_COLLECTOR' || role === 'AUTHORIZED_RECYCLER' || role === 'GOVERNMENT_ADMIN' ? role : (role === 'ADMIN' ? 'GOVERNMENT_ADMIN' : (role === 'AGGREGATOR' ? 'INFORMAL_AGGREGATOR' : (role === 'COLLECTOR' ? 'COLLECTION_COLLECTOR' : (role === 'RECYCLER' ? 'AUTHORIZED_RECYCLER' : 'USER')))),
        account_status: status || 'ACTIVE',
        full_name: `Verified ${role.replace('_', ' ')}`,
        preferred_language: 'en',
        general_location: 'Mumbai Central, Maharashtra',
      };
    }

    if (!this.configured || !this.client) {
      return null;
    }

    try {
      const { data, error } = await this.client.auth.getUser(token);
      if (error || !data?.user) {
        return null;
      }

      // Fetch user profile and active role from public tables
      const profile = await this.getUserProfile(data.user.id);
      return {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone || profile?.phone,
        role: profile?.role || data.user.user_metadata?.role || 'USER',
        account_status: profile?.account_status || 'ACTIVE',
        full_name: profile?.full_name || data.user.user_metadata?.full_name || 'User',
        preferred_language: profile?.preferred_language || 'en',
        general_location: profile?.general_location || 'India',
      };
    } catch (err) {
      this.logger.error(`Error verifying Supabase token: ${err.message}`);
      return null;
    }
  }

  async getUserProfile(userId: string) {
    if (!this.configured) return null;
    try {
      const client = this.getAdminClient();
      const { data, error } = await client
        .from('profiles')
        .select('*, user_roles(role_id, status, roles(name))')
        .eq('id', userId)
        .single();

      if (error) return null;

      const roleName = data.user_roles?.[0]?.roles?.name || 'USER';
      return { ...data, role: roleName };
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.configured) {
      return {
        connected: false,
        message: 'Supabase credentials are not yet configured in .env (development mode active)',
      };
    }
    try {
      const { error } = await this.client.from('roles').select('count', { count: 'exact', head: true });
      if (error) {
        return { connected: false, message: error.message };
      }
      return { connected: true, message: 'Supabase PostgreSQL connection operational' };
    } catch (err) {
      return { connected: false, message: err.message };
    }
  }
}
