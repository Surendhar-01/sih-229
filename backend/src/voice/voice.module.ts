import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceIntentRouterService } from './voice-intent-router.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from '../config/supabase.service';

@Module({
  imports: [ConfigModule],
  controllers: [VoiceController],
  providers: [VoiceIntentRouterService, SupabaseService],
  exports: [VoiceIntentRouterService],
})
export class VoiceModule {}
