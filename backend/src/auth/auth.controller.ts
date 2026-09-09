import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccountStatusGuard } from '../common/guards/account-status.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AllowedAccountStatuses } from '../common/decorators/account-statuses.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth & Profiles')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --------------------------------------------------------------------------
  // Profile Endpoints
  // --------------------------------------------------------------------------
  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile and roles' })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update permitted profile fields (language, name, location)' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('auth/register')
  @ApiOperation({ summary: 'Register account request (Enforces PENDING for professional roles)' })
  async register(@Body() dto: RegisterRequestDto) {
    return this.authService.registerRequest(dto);
  }

  // --------------------------------------------------------------------------
  // Protected Role-Specific Verification Endpoints (Guarded by RBAC & AccountStatus)
  // --------------------------------------------------------------------------
  @Get('user/lots')
  @UseGuards(AuthGuard, RolesGuard, AccountStatusGuard)
  @Roles('USER')
  @AllowedAccountStatuses('ACTIVE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Citizen only endpoint to view personal lots' })
  async getUserLots(@CurrentUser() user: any) {
    return {
      message: `Authorized Citizen Access granted for ${user.full_name}`,
      role: user.role,
      account_status: user.account_status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('aggregator/requests')
  @UseGuards(AuthGuard, RolesGuard, AccountStatusGuard)
  @Roles('INFORMAL_AGGREGATOR')
  @AllowedAccountStatuses('ACTIVE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Informal Aggregator only endpoint to query zone requests' })
  async getAggregatorRequests(@CurrentUser() user: any) {
    return {
      message: `Authorized Aggregator Access granted for ${user.full_name}`,
      role: user.role,
      account_status: user.account_status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('collector/jobs')
  @UseGuards(AuthGuard, RolesGuard, AccountStatusGuard)
  @Roles('COLLECTION_COLLECTOR')
  @AllowedAccountStatuses('ACTIVE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Field Collector only endpoint to query assigned tasks' })
  async getCollectorJobs(@CurrentUser() user: any) {
    return {
      message: `Authorized Field Collector Access granted for ${user.full_name}`,
      role: user.role,
      account_status: user.account_status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('recycler/lots')
  @UseGuards(AuthGuard, RolesGuard, AccountStatusGuard)
  @Roles('AUTHORIZED_RECYCLER')
  @AllowedAccountStatuses('ACTIVE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authorized Recycler only endpoint to view B2B lots' })
  async getRecyclerLots(@CurrentUser() user: any) {
    return {
      message: `Authorized Formal Recycler Access granted for ${user.full_name}`,
      role: user.role,
      account_status: user.account_status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('admin/overview')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Government Admin only surveillance overview' })
  async getAdminOverview(@CurrentUser() user: any) {
    return {
      message: `CPCB Government Regulatory Oversight granted for ${user.full_name}`,
      role: user.role,
      timestamp: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // Admin Approval & Role Management Endpoints
  // --------------------------------------------------------------------------
  @Get('admin/pending-accounts')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all accounts pending approval/verification' })
  async getPendingAccounts() {
    return this.authService.getPendingAccounts();
  }

  @Get('admin/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all platform users across roles' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('admin/accounts/:userId/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GOVERNMENT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve, Reject, or Suspend a user account' })
  async updateAccountStatus(
    @Param('userId') userId: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED',
    @Body('reason') reason: string,
    @CurrentUser() admin: any,
  ) {
    return this.authService.updateAccountStatus(admin.id, userId, status, reason);
  }
}
