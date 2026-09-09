import { Controller, Get, Post, Body, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AggregatorsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getDashboard(aggregatorId: string) {
    if (!this.supabaseService.isConfigured()) {
      return {
        aggregator_id: aggregatorId,
        business_name: 'City Scrap Godown #12',
        metrics: {
          pending_pickups: 4,
          collected_today_kg: 184.5,
          active_collectors: 3,
          projected_margin_inr: 4200.0,
        },
      };
    }
    const client = this.supabaseService.getClient();
    const { data: aggregator } = await client.from('aggregators').select('*').eq('id', aggregatorId).single();
    return aggregator;
  }
}

@ApiTags('Aggregators')
@Controller('aggregators')
@UseGuards(AuthGuard, RolesGuard)
@Roles('INFORMAL_AGGREGATOR', 'GOVERNMENT_ADMIN')
export class AggregatorsController {
  constructor(private readonly aggregatorsService: AggregatorsService) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregator dashboard metrics' })
  async getDashboard(@CurrentUser() user: any) {
    return this.aggregatorsService.getDashboard(user.id);
  }
}

@Module({
  controllers: [AggregatorsController],
  providers: [AggregatorsService, SupabaseService],
  exports: [AggregatorsService],
})
export class AggregatorsModule {}
