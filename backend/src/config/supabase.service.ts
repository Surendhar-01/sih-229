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
    const anonKey = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') || this.configService.get<string>('SUPABASE_ANON_KEY');
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
    if (token.startsWith('dev-mock-')) {
      const parts = token.replace('dev-mock-', '').split('-');
      const role = (parts[0] || 'user').toUpperCase();
      const status = (parts[1] || 'active').toUpperCase();

      let mappedId = `usr-${role.toLowerCase()}-001`;
      let email = `${role.toLowerCase()}@ewaste.gov.in`;
      let fullName = `Verified ${role.replace(/_/g, ' ')}`;

      if (role === 'COLLECTION_COLLECTOR' || role === 'COLLECTOR') {
        mappedId = '0653e3c1-2f1d-4f44-b46a-20b490595c6f';
        email = 'collector@ewaste.gov.in';
        fullName = 'Ramesh Babu';
      } else if (role === 'INFORMAL_AGGREGATOR' || role === 'AGGREGATOR') {
        mappedId = '0f9bb267-12ab-4cb9-a40d-58c38f73267f';
        email = 'aggregator@ewaste.gov.in';
        fullName = 'Ibrahim Khan';
      } else if (role === 'AUTHORIZED_RECYCLER' || role === 'RECYCLER') {
        mappedId = 'ba342f1f-c157-4708-b572-46beecccd868';
        email = 'recycler@ewaste.gov.in';
        fullName = 'EcoClean E-Waste Recyclers Pvt Ltd';
      } else if (role === 'USER') {
        mappedId = 'ff18a5bd-eccc-4ca5-9666-27be86895460';
        email = 'citizen@ewaste.gov.in';
        fullName = 'Citizen Demo';
      }

      return {
        id: mappedId,
        email,
        phone: '+919876543210',
        role: role === 'INFORMAL_AGGREGATOR' || role === 'COLLECTION_COLLECTOR' || role === 'AUTHORIZED_RECYCLER' || role === 'GOVERNMENT_ADMIN' ? role : (role === 'ADMIN' ? 'GOVERNMENT_ADMIN' : (role === 'AGGREGATOR' ? 'INFORMAL_AGGREGATOR' : (role === 'COLLECTOR' ? 'COLLECTION_COLLECTOR' : (role === 'RECYCLER' ? 'AUTHORIZED_RECYCLER' : 'USER')))),
        account_status: status || 'ACTIVE',
        full_name: fullName,
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
      
      const role = profile?.role || data.user.user_metadata?.role || 'USER';

      return {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone || profile?.phone,
        role: role,
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

      if (error) {
        const fallback = await client.from('profiles').select('*').eq('id', userId).single();
        if (fallback.error || !fallback.data) return null;
        return { ...fallback.data, role: fallback.data.role || 'USER' };
      }

      const roleName = data.user_roles?.[0]?.roles?.name || data.role || 'USER';
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
