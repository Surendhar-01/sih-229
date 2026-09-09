import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SupabaseService } from '../config/supabase.service';

@Global()
@Module({
  providers: [AuditService, SupabaseService],
  exports: [AuditService],
})
export class AuditModule {}
