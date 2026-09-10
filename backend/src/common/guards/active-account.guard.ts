import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppForbiddenException } from '../errors/custom.errors';

/** Enforces operational access on the server, independent of frontend routing. */
@Injectable()
export class ActiveAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (user?.account_status !== 'ACTIVE') {
      throw new AppForbiddenException('An active collector account is required for this operation.');
    }
    return true;
  }
}
