import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { AppUnauthorizedException } from '../errors/custom.errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppUnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const user = await this.supabaseService.verifyAccessToken(token);

    if (!user) {
      throw new AppUnauthorizedException('Invalid or expired Supabase authentication token');
    }

    request.user = user;
    return true;
  }
}
