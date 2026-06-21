import { Injectable } from '@nestjs/common';
import { AuthSessionSchema, type AuthSession } from '@handoff/contracts';

@Injectable()
export class AuthService {
  getSession(): AuthSession {
    return AuthSessionSchema.parse({
      authenticated: true,
      subject: 'customer_demo_001',
      displayName: 'Demo Customer',
      roles: ['customer'],
      provider: 'demo-auth',
    });
  }
}
