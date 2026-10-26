import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AccountUser } from '@handoff/contracts';
import { AuthService } from './auth.service';
import { sessionToken } from './session-cookie';

export type AuthenticatedRequest = Request & { user: AccountUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.auth.currentUser(
      sessionToken(request.headers.cookie),
    );
    if (!user) throw new UnauthorizedException('Please log in to continue');
    request.user = user;
    return true;
  }
}
