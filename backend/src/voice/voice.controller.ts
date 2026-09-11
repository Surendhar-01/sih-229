import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceIntentRouterService, VoiceRouteRequestDto } from './voice-intent-router.service';
import { SupabaseService } from '../config/supabase.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@ApiTags('Voice Intent Router')
@Controller('voice')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);
  private readonly aiUrl: string;

  constructor(
    private readonly voiceIntentRouterService: VoiceIntentRouterService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.aiUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  @Post('route')
  @ApiOperation({ summary: 'Centralized Voice Intent Routing with Role Authorization' })
  async routeVoiceCommand(@Body() dto: VoiceRouteRequestDto, @Req() req: any) {
    // Extract authenticated user if Bearer token present
    let user = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      user = await this.supabaseService.verifyAccessToken(token);
    }

    return this.voiceIntentRouterService.routeVoiceCommand(dto, user);
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Whisper Multilingual Audio Transcription' })
  async transcribeAudio(
    @UploadedFile() file: any,
    @Query('language') language?: string,
  ) {
    if (!file) {
      return {
        transcript: '',
        language: language || 'en',
        confidence: 0,
        message: 'No audio file provided',
      };
    }

    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', file.buffer, {
        filename: file.originalname || 'audio.wav',
        contentType: file.mimetype || 'audio/wav',
      });
      if (language) {
        form.append('language', language);
      }

      const response = await axios.post(`${this.aiUrl}/transcribe-audio`, form, {
        headers: form.getHeaders(),
        timeout: 10000,
      });
      return response.data;
    } catch (err: any) {
      this.logger.warn(`Whisper transcription proxy fallback: ${err.message}`);
      return {
        transcript: '',
        language: language || 'en',
        confidence: 0.75,
        engine: 'browser-fallback',
        error: err.message,
      };
    }
  }

  @Get('prompts')
  @ApiOperation({ summary: 'Contextual Voice Guidance Prompts for Current Screen' })
  getVoicePrompts(@Query('route') route?: string, @Query('lang') lang: 'en' | 'hi' | 'mr' = 'en') {
    const r = route || '/';
    const promptsByRoute: Record<string, { en: string[]; hi: string[]; mr: string[] }> = {
      '/': {
        en: ['"Log in as Collector"', '"Log in as Recycler"', '"Check scrap rates"', '"Help me"'],
        hi: ['"कलेक्टर लॉगिन खोलो"', '"रीसायकलर लॉगिन"', '"कचरे का भाव बताओ"', '"मदद करो"'],
        mr: ['"कलेक्टर लॉगिन उघडा"', '"रीसायकलर लॉगिन"', '"कचऱ्याचे दर सांगा"', '"मदत करा"'],
      },
      '/login': {
        en: ['"Use mobile number"', '"Continue with Google"', '"Resend my OTP"', '"Collector login"'],
        hi: ['"मोबाइल से लॉगिन करो"', '"गूगल से लॉगिन"', '"ओटीपी दोबारा भेजो"', '"कलेक्टर लॉगिन"'],
        mr: ['"मोबाइलने लॉगिन करा"', '"Google ने लॉगिन"', '"ओटीपी पुन्हा पाठवा"', '"कलेक्टर लॉगिन"'],
      },
      '/collector/dashboard': {
        en: ['"Create new lot"', '"Show all lots"', '"What is copper price?"', '"Go to earnings"'],
        hi: ['"नया लॉट बनाओ"', '"सारे लॉट्स दिखाओ"', '"तांबे का भाव क्या है?"', '"कमाई दिखाओ"'],
        mr: ['"नवीन लॉट तयार करा"', '"सर्व लॉट्स दाखवा"', '"तांब्याचा दर काय आहे?"', '"कमाई दाखवा"'],
      },
      '/recycler/dashboard': {
        en: ['"Show opportunities"', '"Open bids"', '"View Form 6 handovers"', '"Payment ledger"'],
        hi: ['"नए अवसर दिखाओ"', '"बोली खोलो"', '"फॉर्म 6 रसीदें दिखाओ"', '"पेमेंट लेजर"'],
        mr: ['"नवीन संधी दाखवा"', '"बोली उघडा"', '"फॉर्म 6 पावत्या दाखवा"', '"पेमेंट लेजर"'],
      },
      '/admin/dashboard': {
        en: ['"Show pending accounts"', '"View all users"', '"Audit report"', '"Check compliance"'],
        hi: ['"पेंडिंग खाते दिखाओ"', '"सभी यूजर्स"', '"ऑडिट रिपोर्ट"', '"अनुपालन जांचो"'],
        mr: ['"प्रलंबित खाती दाखवा"', '"सर्व वापरकर्ते"', '"ऑडिट अहवाल"', '"तपासणी अहवाल"'],
      },
    };

    const matched = Object.keys(promptsByRoute).find((key) => r.startsWith(key)) || '/';
    const set = promptsByRoute[matched] || promptsByRoute['/'];
    return {
      route: r,
      prompts: set[lang] || set.en,
    };
  }
}
