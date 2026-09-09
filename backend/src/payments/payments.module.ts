import { Controller, Post, Body, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async settleCashPayment(lotId: string, amount: number, collectorId: string) {
    return {
      success: true,
      lot_id: lotId,
      amount,
      method: 'CASH',
      status: 'SETTLED',
      receipt_number: `RCP-${Date.now()}`,
    };
  }
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('settle-cash')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Settle cash payment on pickup with digital receipt' })
  async settleCash(@Body() body: { lot_id: string; amount: number; collector_id: string }) {
    return this.paymentsService.settleCashPayment(body.lot_id, body.amount, body.collector_id);
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, SupabaseService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
