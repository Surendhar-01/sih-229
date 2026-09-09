import { Controller, Get, Post, Body, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class CollectorsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAssignedJobs(collectorId: string) {
    if (!this.supabaseService.isConfigured()) {
      return [
        {
          assignment_id: 'a1',
          lot_id: '11111111-1111-1111-1111-111111111111',
          lot_code: 'EW-2026-000101',
          status: 'OFFERED',
          payout_amount: 350.0,
          pickup_address: '402 Green Valley, Mumbai',
          distance_km: 2.8,
        },
      ];
    }
    const client = this.supabaseService.getClient();
    const { data } = await client
      .from('collector_assignments')
      .select('*, material_lots(*)')
      .eq('collector_id', collectorId)
      .order('assigned_at', { ascending: false });
    return data || [];
  }
}

@ApiTags('Collectors')
@Controller('collectors')
@UseGuards(AuthGuard, RolesGuard)
@Roles('COLLECTION_COLLECTOR', 'INFORMAL_AGGREGATOR', 'GOVERNMENT_ADMIN')
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) {}

  @Get('jobs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assigned jobs queue for the collector' })
  async getJobs(@CurrentUser() user: any) {
    return this.collectorsService.getAssignedJobs(user.id);
  }
}

@Module({
  controllers: [CollectorsController],
  providers: [CollectorsService, SupabaseService],
  exports: [CollectorsService],
})
export class CollectorsModule {}
