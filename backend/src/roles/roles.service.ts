import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class RolesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listRoles() {
    if (!this.supabaseService.isConfigured()) {
      return [
        { id: 1, name: 'USER', description: 'Citizen/Consumer' },
        { id: 2, name: 'INFORMAL_AGGREGATOR', description: 'Scrap godown/yard manager' },
        { id: 3, name: 'COLLECTION_COLLECTOR', description: 'Field collection agent' },
        { id: 4, name: 'AUTHORIZED_RECYCLER', description: 'CPCB certified recycler' },
        { id: 5, name: 'GOVERNMENT_ADMIN', description: 'CPCB/SPCB regulator' },
      ];
    }

    const { data } = await this.supabaseService.getClient().from('roles').select('*');
    return data || [];
  }
}
