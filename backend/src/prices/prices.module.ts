import { Controller, Get, Query, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class PricesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getPriceIntelligence(categoryId?: number) {
    if (!this.supabaseService.isConfigured()) {
      return {
        benchmark_date: new Date().toISOString(),
        rates: [
          { category: 'CRT_DISPLAY', current_avg: 380.0, range: [320, 440], trend: 'STABLE' },
          { category: 'PCB_ASSEMBLY', current_avg: 420.0, range: [390, 480], trend: 'RISING' },
          { category: 'CABLES_WIRES', current_avg: 580.0, range: [550, 620], trend: 'RISING' },
          { category: 'LI_BATTERY', current_avg: 45.0, range: [35, 55], trend: 'VOLATILE' },
        ],
      };
    }
    const client = this.supabaseService.getClient();
    let query = client.from('price_records').select('*');
    if (categoryId) query = query.eq('category_id', categoryId);
    const { data } = await query.order('recorded_at', { ascending: false }).limit(20);
    return data || [];
  }
}

@ApiTags('Price Intelligence')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get('intelligence')
  @ApiOperation({ summary: 'Get current scrap price intelligence rates' })
  async getPrices(@Query('categoryId') categoryId?: string) {
    return this.pricesService.getPriceIntelligence(categoryId ? Number(categoryId) : undefined);
  }
}

@Module({
  controllers: [PricesController],
  providers: [PricesService, SupabaseService],
  exports: [PricesService],
})
export class PricesModule {}
