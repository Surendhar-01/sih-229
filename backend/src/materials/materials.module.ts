import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { SupabaseService } from '../config/supabase.service';

@Module({
  controllers: [MaterialsController],
  providers: [MaterialsService, SupabaseService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
