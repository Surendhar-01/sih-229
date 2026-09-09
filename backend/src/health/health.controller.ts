import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../config/supabase.service';
import axios from 'axios';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'System Health Check' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async checkHealth() {
    const aiServiceUrl = this.configService.get<string>(
      'AI_SERVICE_URL',
      'http://localhost:8000',
    );

    // 1. Supabase Check
    const supabaseStatus = await this.supabaseService.testConnection();

    // 2. Python AI Service Check
    let aiServiceStatus = {
      connected: false,
      message: 'AI Service check not completed',
    };

    try {
      const response = await axios.get(`${aiServiceUrl}/health`, {
        timeout: 2000,
      });
      if (response.status === 200) {
        aiServiceStatus = {
          connected: true,
          message: 'Python FastAPI AI Service is operational',
        };
      }
    } catch (err) {
      aiServiceStatus = {
        connected: false,
        message: `AI service unreachable at ${aiServiceUrl}: ${err.message}`,
      };
    }

    const isSystemHealthy = true; // NestJS itself is running

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'UP',
          uptime: process.uptime(),
          version: '1.0.0',
        },
        supabase: {
          status: supabaseStatus.connected ? 'UP' : 'STANDBY',
          details: supabaseStatus.message,
        },
        ai_service: {
          status: aiServiceStatus.connected ? 'UP' : 'STANDBY',
          details: aiServiceStatus.message,
        },
      },
    };
  }
}
