import { Controller, Get, Post, Body, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class RecyclersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getRecyclerLots(recyclerId: string) {
    if (!this.supabaseService.isConfigured()) {
      return [
        {
          id: 'quote-1',
          lot_code: 'EW-2026-000088',
          material_category: 'CRT_DISPLAY',
          weight_kg: 850.0,
          quote_status: 'PENDING',
          offered_rate_per_kg: 24.5,
        },
      ];
    }
    const client = this.supabaseService.getClient();
    const { data } = await client.from('recycler_quotes').select('*, material_lots(*)').eq('recycler_id', recyclerId);
    return data || [];
  }
}

@ApiTags('Recyclers')
@Controller('recyclers')
@UseGuards(AuthGuard, RolesGuard)
@Roles('AUTHORIZED_RECYCLER', 'GOVERNMENT_ADMIN')
export class RecyclersController {
  constructor(private readonly recyclersService: RecyclersService) {}

  @Get('quotes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active B2B recycler quotes & incoming lots' })
  async getQuotes(@CurrentUser() user: any) {
    return this.recyclersService.getRecyclerLots(user.id);
  }
}

@Module({
  controllers: [RecyclersController],
  providers: [RecyclersService, SupabaseService],
  exports: [RecyclersService],
})
export class RecyclersModule {}
