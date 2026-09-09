import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getUserById(id: string) {
    if (!this.supabaseService.isConfigured()) {
      return { id, full_name: 'Demo User', phone: '+919876543210', role: 'USER' };
    }
    const { data } = await this.supabaseService.getClient().from('profiles').select('*').eq('id', id).single();
    return data;
  }
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService, SupabaseService],
  exports: [UsersService],
})
export class UsersModule {}
