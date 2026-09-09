import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ExternalAiServiceException } from '../common/errors/custom.errors';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.aiUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async classifyMaterial(payload: any) {
    try {
      const response = await axios.post(`${this.aiUrl}/material-classification`, payload, {
        timeout: 5000,
      });
      return response.data;
    } catch (err) {
      this.logger.warn(`AI classification fallback: ${err.message}`);
      return {
        material_category: 'CRT_DISPLAY',
        subcategory: 'CRT_TV_21INCH',
        condition: 'INTACT',
        confidence: 0.94,
        possible_materials: ['Leaded Glass', 'Copper Yoke', 'Circuit Board', 'ABS Plastics'],
        estimated_weight_range: { min_kg: 16.0, max_kg: 20.0 },
        estimated_value_range: { min_inr: 350.0, max_inr: 450.0 },
        source: 'development_fallback',
      };
    }
  }

  async analyzePrice(payload: any) {
    try {
      const response = await axios.post(`${this.aiUrl}/price-analysis`, payload, { timeout: 5000 });
      return response.data;
    } catch (err) {
      this.logger.warn(`AI price analysis fallback: ${err.message}`);
      return {
        material: payload.material || 'CRT_TV_21INCH',
        current_average_price: 380.0,
        suggested_range: { min: 320.0, max: 440.0 },
        market_trend: 'STABLE',
        seven_day_avg: 375.0,
        thirty_day_avg: 370.0,
        source: 'development_fallback',
      };
    }
  }

  async recommendCollector(payload: any) {
    try {
      const response = await axios.post(`${this.aiUrl}/collector-recommendation`, payload, { timeout: 5000 });
      return response.data;
    } catch (err) {
      return {
        recommended_collectors: [
          { id: 'c1', name: 'Ramesh (Field Collector)', distance_km: 3.2, score: 0.92 },
          { id: 'c2', name: 'Suresh (Kabadiwala Express)', distance_km: 5.1, score: 0.84 },
        ],
        source: 'development_fallback',
      };
    }
  }

  async recommendRecycler(payload: any) {
    try {
      const response = await axios.post(`${this.aiUrl}/recycler-recommendation`, payload, { timeout: 5000 });
      return response.data;
    } catch (err) {
      return {
        recommended_recyclers: [
          { id: 'r1', name: 'EcoGreen Recyclers Ltd (CPCB Authorized)', cpcb_valid: true, distance_km: 14.5, rate_per_kg: 22.0 },
        ],
        source: 'development_fallback',
      };
    }
  }

  async detectAnomaly(payload: any) {
    try {
      const response = await axios.post(`${this.aiUrl}/anomaly-detection`, payload, { timeout: 5000 });
      return response.data;
    } catch (err) {
      return {
        is_anomaly: false,
        risk_level: 'LOW',
        confidence: 0.98,
        source: 'development_fallback',
      };
    }
  }
}
