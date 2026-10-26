import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/** Browser mutations must come through our website with an explicit JSON header. */
@Injectable()
export class SameOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    const allowedOrigin = new URL(
      process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    ).origin;
    if (
      request.headers.origin !== allowedOrigin ||
      request.headers['x-handoff-csrf'] !== '1' ||
      !request.is('application/json')
    ) {
      throw new ForbiddenException('Use the website to submit this request');
    }
    return true;
  }
}
