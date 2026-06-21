jest.mock('@handoff/contracts', () => ({
  AuthSessionSchema: { parse: (value: unknown) => value },
}));

import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('returns a typed demo session status', () => {
    const service = new AuthService();

    const result = service.getSession();

    expect(result).toEqual({
      authenticated: true,
      subject: 'customer_demo_001',
      displayName: 'Demo Customer',
      roles: ['customer'],
      provider: 'demo-auth',
    });
  });
});
