import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

  async verifyAccessToken(token: string) {
    if (!this.configured || !this.client) {
      // In development fallback/demo mode when token is 'dev-mock-token'
      if (token.startsWith('dev-mock-')) {
        const role = token.replace('dev-mock-', '').toUpperCase();
        return {
          id: '00000000-0000-0000-0000-000000000001',
          email: `${role.toLowerCase()}@ewaste.gov.in`,
          phone: '+919876543210',
          role: role || 'USER',
          full_name: `Dev ${role} User`,
        };
      }
      return null;
    }

    try {
      const { data, error } = await this.client.auth.getUser(token);
      if (error || !data?.user) {
        return null;
      }

      // Fetch user profile and role from profiles table
      const profile = await this.getUserProfile(data.user.id);
      return {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone || profile?.phone,
        role: profile?.role || data.user.user_metadata?.role || 'USER',
        full_name: profile?.full_name || data.user.user_metadata?.full_name || 'User',
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
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return data;
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
