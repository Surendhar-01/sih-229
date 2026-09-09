import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { SupabaseService } from '../config/supabase.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService, SupabaseService],
  exports: [RolesService],
})
export class RolesModule {}
