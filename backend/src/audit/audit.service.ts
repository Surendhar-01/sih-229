import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

export interface CreateAuditLogDto {
  actor_id?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  lot_id?: string;
  transaction_id?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async logEvent(entry: CreateAuditLogDto): Promise<void> {
    this.logger.log(
      `[AUDIT] Action: ${entry.action} on ${entry.entity_type}:${entry.entity_id} by Actor: ${entry.actor_id || 'SYSTEM'} (${entry.actor_role || 'SYSTEM'})`,
    );

    if (this.supabaseService.isConfigured()) {
      try {
        const client = this.supabaseService.getAdminClient();
        await client.from('audit_logs').insert([
          {
            actor_id: entry.actor_id || null,
            actor_role: entry.actor_role || 'SYSTEM',
            action: entry.action,
            entity_type: entry.entity_type,
            entity_id: entry.entity_id,
            old_data: entry.old_data || null,
            new_data: entry.new_data || null,
            lot_id: entry.lot_id || null,
            transaction_id: entry.transaction_id || null,
          },
        ]);
      } catch (err) {
        this.logger.error(`Failed to persist audit log: ${err.message}`);
      }
    }
  }
}
