import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI Services')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('classify')
  @ApiOperation({ summary: 'AI Material Classification & Identification' })
  async classify(@Body() payload: any) {
    return this.aiService.classifyMaterial(payload);
  }

  @Post('price-analysis')
  @ApiOperation({ summary: 'Dynamic Price Intelligence Analysis' })
  async priceAnalysis(@Body() payload: any) {
    return this.aiService.analyzePrice(payload);
  }

  @Post('recommend-collector')
  @ApiOperation({ summary: 'Smart Multi-Criteria Collector Matcher' })
  async recommendCollector(@Body() payload: any) {
    return this.aiService.recommendCollector(payload);
  }

  @Post('recommend-recycler')
  @ApiOperation({ summary: 'CPCB Authorized Recycler Matcher' })
  async recommendRecycler(@Body() payload: any) {
    return this.aiService.recommendRecycler(payload);
  }

  @Post('detect-anomaly')
  @ApiOperation({ summary: 'Transaction Fraud & Hazard Anomaly Detection' })
  async detectAnomaly(@Body() payload: any) {
    return this.aiService.detectAnomaly(payload);
  }
}
