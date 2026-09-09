import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getCurrentUser(userId: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        id: userId,
        email: 'dev.user@ewaste.gov.in',
        phone: '+919876543210',
        role: 'USER',
        full_name: 'Dev Citizen',
        preferred_language: 'en',
        is_active: true,
      };
    }

    const client = this.supabaseService.getAdminClient();
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return profile;
  }

  async syncProfile(userId: string, profileData: any) {
    if (!this.supabaseService.isConfigured()) {
      return { id: userId, ...profileData, message: 'Profile synced (mock mode)' };
    }

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('profiles')
      .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
