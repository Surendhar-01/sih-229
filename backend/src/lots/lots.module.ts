import { Module } from '@nestjs/common';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { SupabaseService } from '../config/supabase.service';

@Module({
  controllers: [LotsController],
  providers: [LotsService, SupabaseService],
  exports: [LotsService],
})
export class LotsModule {}
