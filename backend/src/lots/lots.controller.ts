import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Material Lots')
@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post('ai-scan')
  @ApiOperation({ summary: 'Instant AI Material Identification and Valuation Scan' })
  async scanWithAi(@Body() body: { image_base64?: string; user_hints?: string }) {
    return this.lotsService.scanImageWithAi(body);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new verified e-waste collection lot' })
  async createLot(@CurrentUser() user: any, @Body() dto: CreateLotDto) {
    return this.lotsService.createLot(user.id, dto, user.full_name);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lots created by current citizen user' })
  async getMyLots(@CurrentUser() user: any) {
    return this.lotsService.getMyLots(user.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lots filtered by user role and context' })
  async getLots(@CurrentUser() user: any) {
    return this.lotsService.getAllLots(user.role, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lot details by ID or lot code (EW-2026-XXXXXX)' })
  async getLotById(@Param('id') id: string) {
    return this.lotsService.getLotById(id);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Citizen cancels lot prior to pickup verification' })
  async cancelLot(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.lotsService.cancelLot(id, user.id, reason);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transition lot state along finite state machine' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.lotsService.updateStatus(id, status, user.id, user.role);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lot status using REST PUT semantics' })
  async replaceLotStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.lotsService.updateStatus(id, status, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel/delete a lot before pickup completion' })
  async deleteLot(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.lotsService.cancelLot(id, user.id, reason || 'Cancelled by user');
  }

  @Post(':id/verify-pickup')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Collector verifies weight on scale and confirms citizen OTP' })
  async verifyPickup(
    @Param('id') id: string,
    @Body() body: { verified_weight_kg: number; otp: string },
    @CurrentUser() user: any,
  ) {
    return this.lotsService.verifyPickup(id, body.verified_weight_kg, body.otp, user.id);
  }

  @Post(':id/assign-collector')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aggregator assigns field collector to lot' })
  async assignCollector(
    @Param('id') id: string,
    @Body() body: { collector_id: string; collector_name: string },
    @CurrentUser() user: any,
  ) {
    return this.lotsService.assignCollector(id, body.collector_id, body.collector_name, user.id);
  }
}
