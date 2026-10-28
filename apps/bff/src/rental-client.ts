import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { rentalServiceKey, SESSION_COOKIE_NAME } from '@handoff/contracts';
import type { Request } from 'express';
import { sessionToken } from './auth/session-cookie';
@Injectable()
export class RentalClient {
  private readonly origin = process.env.RENTAL_URL ?? 'http://127.0.0.1:3004';
  private readonly key = rentalServiceKey(process.env);
  async forward(request: Request): Promise<{ status: number; body: unknown }> {
    // Build the path/query separately: an inbound URL cannot replace the host.
    const target = new URL(this.origin);
    target.pathname = request.path;
    target.search = new URL(request.originalUrl, 'http://gateway.local').search;
    const token = sessionToken(request.headers.cookie);
    try {
      const response = await fetch(target, {
        method: request.method,
        redirect: 'error',
        signal: AbortSignal.timeout(20000),
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': this.key,
          ...(token ? { Cookie: `${SESSION_COOKIE_NAME}=${token}` } : {}),
        },
        ...(request.method === 'POST'
          ? { body: JSON.stringify(request.body) }
          : {}),
      });
      return {
        status: response.status,
        body: request.method === 'HEAD' ? null : await response.json(),
      };
    } catch {
      throw new ServiceUnavailableException(
        'Rental service unavailable. Please try again.',
      );
    }
  }
}
