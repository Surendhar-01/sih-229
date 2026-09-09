import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCOUNT_STATUSES_KEY } from '../decorators/account-statuses.decorator';

@Injectable()
export class AccountStatusGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedStatuses = this.reflector.getAllAndOverride<string[]>(
      ACCOUNT_STATUSES_KEY,
      [context.getHandler(), context.getClass()],
    ) || ['ACTIVE'];

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return true; // AuthGuard will catch unauthenticated
    }

    const currentStatus = user.account_status || 'ACTIVE';

    if (!allowedStatuses.includes(currentStatus)) {
      let message = `Account status is '${currentStatus}'. Access is restricted.`;
      if (currentStatus === 'PENDING') {
        message = 'Your professional account registration is pending review & verification by an administrator.';
      } else if (currentStatus === 'SUSPENDED') {
        message = 'Your account has been suspended due to regulatory compliance or safety alerts.';
      } else if (currentStatus === 'REJECTED') {
        message = 'Your account application was reviewed and rejected. Contact support for assistance.';
      }

      throw new HttpException(
        {
          success: false,
          message,
          account_status: currentStatus,
          errors: [`Account status '${currentStatus}' not permitted for this action. Allowed: [${allowedStatuses.join(', ')}]`],
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
