import { Controller, Get, Param, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class TraceabilityService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getLotTimeline(lotIdentifier: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        lot_code: lotIdentifier,
        current_status: 'AGGREGATOR_REVIEW',
        events: [
          { event_type: 'LOT_CREATED', from: null, to: 'CREATED', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'Citizen' },
          { event_type: 'AI_ANALYSIS_COMPLETED', from: 'CREATED', to: 'AI_ANALYZED', timestamp: new Date(Date.now() - 3500000).toISOString(), actor: 'System AI' },
          { event_type: 'AGGREGATOR_CLAIMED', from: 'AI_ANALYZED', to: 'AGGREGATOR_REVIEW', timestamp: new Date(Date.now() - 1800000).toISOString(), actor: 'Aggregator' },
        ],
      };
    }
    const client = this.supabaseService.getClient();
    const { data } = await client
      .from('traceability_events')
      .select('*')
      .order('created_at', { ascending: true });
    return data || [];
  }

  async appendEvent(event: {
    lot_id: string;
    event_type: string;
    actor_id: string;
    actor_role: string;
    from_status?: string;
    to_status?: string;
    latitude?: number;
    longitude?: number;
    metadata?: any;
  }) {
    if (!this.supabaseService.isConfigured()) return;
    try {
      const client = this.supabaseService.getAdminClient();
      await client.from('traceability_events').insert([
        {
          lot_id: event.lot_id,
          event_type: event.event_type,
          actor_id: event.actor_id,
          actor_role: event.actor_role,
          from_status: event.from_status,
          to_status: event.to_status,
          metadata: event.metadata || {},
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn('Could not append traceability event:', err);
    }
  }
}

@ApiTags('Traceability')
@Controller('traceability')
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('lot/:lotIdentifier')
  @ApiOperation({ summary: 'Get complete immutable lifecycle traceability timeline for a lot' })
  async getTimeline(@Param('lotIdentifier') lotIdentifier: string) {
    return this.traceabilityService.getLotTimeline(lotIdentifier);
  }
}

@Module({
  controllers: [TraceabilityController],
  providers: [TraceabilityService, SupabaseService],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
