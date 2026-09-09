import { Controller, Get, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Injectable()
export class AdminService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getCommandCenterMetrics() {
    return {
      national_summary: {
        total_tons_collected: 1420.8,
        formalization_rate: '74.2%',
        active_aggregators: 184,
        registered_field_collectors: 1250,
        authorized_recyclers: 42,
        active_anomalies_flagged: 3,
      },
      material_distribution: [
        { category: 'CRT_DISPLAY', percentage: 28.5 },
        { category: 'PCB_ASSEMBLY', percentage: 34.0 },
        { category: 'LI_BATTERY', percentage: 12.5 },
        { category: 'CABLES_WIRES', percentage: 15.0 },
        { category: 'OTHER', percentage: 10.0 },
      ],
      compliance_status: 'HEALTHY',
    };
  }

  async getAnomalyAlerts() {
    return [
      {
        id: 'anom-1',
        lot_code: 'EW-2026-000045',
        risk_level: 'HIGH',
        detector_type: 'PRICE_OUTLIER',
        deviation_percentage: 64.2,
        reason: 'Price offered (₹850/kg) exceeds 30-day regional standard by 64.2%',
        is_reviewed: false,
        created_at: new Date().toISOString(),
      },
    ];
  }
}

@ApiTags('Government Admin')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('GOVERNMENT_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Government Admin Command Center macro KPIs' })
  async getMetrics() {
    return this.adminService.getCommandCenterMetrics();
  }

  @Get('anomalies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active transaction and safety anomaly alerts' })
  async getAnomalies() {
    return this.adminService.getAnomalyAlerts();
  }
}

@Module({
  controllers: [AdminController],
  providers: [AdminService, SupabaseService],
  exports: [AdminService],
})
export class AdminModule {}
