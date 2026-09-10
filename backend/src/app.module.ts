import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SupabaseService } from './config/supabase.service';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MaterialsModule } from './materials/materials.module';
import { LotsModule } from './lots/lots.module';
import { AggregatorsModule } from './aggregators/aggregators.module';
import { CollectorsModule } from './collectors/collectors.module';
import { RecyclersModule } from './recyclers/recyclers.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { PricesModule } from './prices/prices.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TraceabilityModule } from './traceability/traceability.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { DatasetsModule } from './datasets/datasets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // Rate limit: 120 requests per minute per client
      },
    ]),
    HealthModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MaterialsModule,
    LotsModule,
    AggregatorsModule,
    CollectorsModule,
    RecyclersModule,
    AssignmentsModule,
    PricesModule,
    TransactionsModule,
    TraceabilityModule,
    PaymentsModule,
    NotificationsModule,
    AiModule,
    AdminModule,
    DatasetsModule,
  ],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
