import { Controller, Get, Post, Body, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async listTransactions(userId: string) {
    if (!this.supabaseService.isConfigured()) {
      return [
        {
          id: 'tx-1',
          lot_id: '11111111-1111-1111-1111-111111111111',
          amount: 350.0,
          payment_method: 'CASH',
          status: 'SETTLED',
          created_at: new Date().toISOString(),
        },
      ];
    }
    const client = this.supabaseService.getClient();
    const { data } = await client
      .from('transactions')
      .select('*')
      .or(`payer_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    return data || [];
  }
}

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user transaction ledger' })
  async getTransactions(@CurrentUser() user: any) {
    return this.transactionsService.listTransactions(user.id);
  }
}

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, SupabaseService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
