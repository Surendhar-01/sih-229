import { Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { SupabaseService } from '../config/supabase.service';

@Module({
  controllers: [DatasetsController],
  providers: [DatasetsService, SupabaseService],
  exports: [DatasetsService],
})
export class DatasetsModule {}
