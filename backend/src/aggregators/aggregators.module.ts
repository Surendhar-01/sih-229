import { BadRequestException, Body, ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

type QuoteInput = { collection_cost: number; handling_cost: number; other_cost?: number; margin_type: 'FIXED' | 'PERCENTAGE'; margin_value: number; final_quote?: number; notes?: string };

@Injectable()
export class AggregatorsService {
  constructor(private readonly supabaseService: SupabaseService, private readonly audit: AuditService) {}

  private client() { return this.supabaseService.getAdminClient(); }
  private assertConfigured() { if (!this.supabaseService.isConfigured()) throw new BadRequestException('Aggregator workflow requires Supabase configuration.'); }

  async getLots(aggregatorId: string) {
    this.assertConfigured();
    const { data, error } = await this.client().from('material_lots').select('*, images:lot_images(*)').or(`assigned_aggregator_id.eq.${aggregatorId},and(status.eq.WAITING_FOR_QUOTE,assigned_aggregator_id.is.null)`).order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message); return data || [];
  }

  async claimLot(lotId: string, aggregatorId: string) {
    this.assertConfigured();
    const { data, error } = await this.client().from('material_lots').update({ assigned_aggregator_id: aggregatorId, status: 'AGGREGATOR_REVIEW' }).eq('id', lotId).eq('status', 'WAITING_FOR_QUOTE').is('assigned_aggregator_id', null).select().single();
    if (error || !data) throw new ConflictException('This lot has already been reviewed by another aggregator.');
    await this.audit.logEvent({ actor_id: aggregatorId, actor_role: 'INFORMAL_AGGREGATOR', action: 'AGGREGATOR_REVIEW_STARTED', entity_type: 'material_lots', entity_id: lotId, lot_id: lotId, new_data: { status: 'AGGREGATOR_REVIEW' } }); return data;
  }

  async getDashboard(aggregatorId: string) {
    const lots = await this.getLots(aggregatorId); const today = new Date().toISOString().slice(0, 10);
    const quotes = this.supabaseService.isConfigured() ? (await this.client().from('aggregator_quotes').select('*').eq('aggregator_id', aggregatorId)).data || [] : [];
    return { metrics: { new_lots: lots.filter((lot: any) => lot.status === 'WAITING_FOR_QUOTE').length, pending_review: lots.filter((lot: any) => lot.status === 'AGGREGATOR_REVIEW').length, quotes_prepared: quotes.filter((quote: any) => quote.status === 'DRAFT').length, awaiting_collection: quotes.filter((quote: any) => quote.status === 'APPROVED').length, completed_lots: lots.filter((lot: any) => lot.status === 'COMPLETED').length, total_lots: lots.length, today_estimated_value: lots.filter((lot: any) => lot.created_at?.startsWith(today)).reduce((total: number, lot: any) => total + Number(lot.estimated_value || 0), 0), average_processing_hours: null } };
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

  @Get('lots') async getLots(@CurrentUser() user: any) { return this.aggregatorsService.getLots(user.id); }
  @Post('lots/:id/claim') async claim(@Param('id') id: string, @CurrentUser() user: any) { return this.aggregatorsService.claimLot(id, user.id); }
}

@Module({
  controllers: [AggregatorsController],
  imports: [], providers: [AggregatorsService, SupabaseService, AuditService],
  exports: [AggregatorsService],
})
export class AggregatorsModule {}
