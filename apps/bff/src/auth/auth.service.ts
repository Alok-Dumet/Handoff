import { Injectable } from '@nestjs/common';
import { AuthSessionSchema, type AuthSession } from '@handoff/contracts';

export type ClerkIdentityContext = {
  clerkUserId?: string;
  displayName?: string;
  email?: string;
};

@Injectable()
export class AuthService {
  getSession(identity: ClerkIdentityContext = {}): AuthSession {
    if (!identity.clerkUserId) {
      return AuthSessionSchema.parse({
        authenticated: false,
        roles: [],
        provider: 'anonymous',
      });
    }

    return AuthSessionSchema.parse({
      authenticated: true,
      subject: identity.clerkUserId,
      displayName: identity.displayName ?? 'HandOff Customer',
      email: identity.email,
      roles: ['customer'],
      provider: 'clerk',
    });
  }
}
