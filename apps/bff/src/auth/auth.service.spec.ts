jest.mock('@handoff/contracts', () => ({
  AuthSessionSchema: { parse: (value: unknown) => value },
}));

import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('returns an anonymous session without Clerk identity', () => {
    const service = new AuthService();

    const result = service.getSession();

    expect(result).toEqual({
      authenticated: false,
      roles: [],
      provider: 'anonymous',
    });
  });

  it('returns a Clerk-backed customer session from forwarded identity', () => {
    const service = new AuthService();

    const result = service.getSession({
      clerkUserId: 'user_123',
      displayName: 'Alex Driver',
      email: 'alex@example.com',
    });

    expect(result).toEqual({
      authenticated: true,
      subject: 'user_123',
      displayName: 'Alex Driver',
      email: 'alex@example.com',
      roles: ['customer'],
      provider: 'clerk',
    });
  });
});
