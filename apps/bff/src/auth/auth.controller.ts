import { Controller, Get, Headers } from '@nestjs/common';
import { type AuthSession } from '@handoff/contracts';
import { AuthService, type ClerkIdentityContext } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('session')
  getSession(
    @Headers('x-handoff-clerk-user-id') clerkUserId?: string,
    @Headers('x-handoff-display-name') displayName?: string,
    @Headers('x-handoff-email') email?: string,
    @Headers('x-handoff-internal-secret') internalSecret?: string,
  ): AuthSession {
    if (!isTrustedInternalCaller(internalSecret)) {
      return this.authService.getSession();
    }

    return this.authService.getSession(
      decodeIdentityHeaders({ clerkUserId, displayName, email }),
    );
  }
}

function decodeIdentityHeaders(
  identity: ClerkIdentityContext,
): ClerkIdentityContext {
  return {
    clerkUserId: identity.clerkUserId,
    displayName: decodeHeader(identity.displayName),
    email: decodeHeader(identity.email),
  };
}

function decodeHeader(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function isTrustedInternalCaller(internalSecret?: string): boolean {
  const expectedSecret = process.env.BFF_INTERNAL_AUTH_SECRET;

  if (!expectedSecret) {
    return true;
  }

  return internalSecret === expectedSecret;
}
