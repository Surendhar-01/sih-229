import { Module } from '@nestjs/common';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { SupabaseService } from '../config/supabase.service';
import { AiModule } from '../ai/ai.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AiModule, AuditModule],
  controllers: [LotsController],
  providers: [LotsService, SupabaseService],
  exports: [LotsService],
})
export class LotsModule {}
