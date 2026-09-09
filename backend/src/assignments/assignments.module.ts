import { Controller, Post, Body, Param, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async assignCollector(lotId: string, collectorId: string, aggregatorId: string, payout: number) {
    if (!this.supabaseService.isConfigured()) {
      return {
        assignment_id: 'assign-mock-1',
        lot_id: lotId,
        collector_id: collectorId,
        status: 'OFFERED',
        payout_amount: payout,
      };
    }
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('collector_assignments')
      .insert([
        {
          lot_id: lotId,
          collector_id: collectorId,
          assigned_by_aggregator_id: aggregatorId,
          payout_amount: payout,
          status: 'OFFERED',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await this.auditService.logEvent({
      actor_id: aggregatorId,
      actor_role: 'INFORMAL_AGGREGATOR',
      action: 'COLLECTOR_ASSIGNED',
      entity_type: 'collector_assignments',
      entity_id: data.id,
      lot_id: lotId,
    });

    return data;
  }
}

@ApiTags('Collector Assignments')
@Controller('assignments')
@UseGuards(AuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post(':lotId/assign')
  @Roles('INFORMAL_AGGREGATOR', 'GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dispatch a field collector to a lot' })
  async assign(@Param('lotId') lotId: string, @Body() body: { collector_id: string; payout: number; aggregator_id: string }) {
    return this.assignmentsService.assignCollector(lotId, body.collector_id, body.aggregator_id, body.payout);
  }
}

@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService, SupabaseService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
