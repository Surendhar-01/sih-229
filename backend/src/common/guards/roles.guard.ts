import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppForbiddenException } from '../errors/custom.errors';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new AppForbiddenException('No role associated with authenticated user');
    }

    // Government Admin has elevated master access across all protected endpoints
    if (user.role === 'GOVERNMENT_ADMIN') {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new AppForbiddenException(
        `Role '${user.role}' is not authorized to perform this operation. Allowed: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
