import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Material Lots')
@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new e-waste collection lot' })
  async createLot(@CurrentUser() user: any, @Body() dto: CreateLotDto) {
    return this.lotsService.createLot(user.id, dto);
  }

  @Get('my-lots')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lots associated with the current user' })
  async getMyLots(@CurrentUser() user: any) {
    return this.lotsService.getUserLots(user.id, user.role);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lot details by ID or lot code' })
  async getLotById(@Param('id') id: string) {
    return this.lotsService.getLotById(id);
  }
}
