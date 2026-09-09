import { Controller, Get, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getUserNotifications(userId: string) {
    if (!this.supabaseService.isConfigured()) {
      return [
        {
          id: 'notif-1',
          title: 'Collector Assigned',
          body: 'Collector Ramesh is assigned to pick up your e-waste.',
          is_read: false,
          sent_at: new Date().toISOString(),
        },
      ];
    }
    const client = this.supabaseService.getClient();
    const { data } = await client
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('sent_at', { ascending: false });
    return data || [];
  }
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications' })
  async getNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getUserNotifications(user.id);
  }
}

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, SupabaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
