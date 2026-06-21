jest.mock('@handoff/contracts', () => ({
  CustomerProfileSchema: { parse: (value: unknown) => value },
}));

import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  it('returns a typed guest customer profile without Clerk identity', () => {
    const service = new CustomersService();

    const result = service.getCurrentCustomer();

    expect(result).toEqual({
      id: 'anonymous_customer',
      displayName: 'Guest Customer',
      email: 'guest@example.com',
      loyaltyTier: 'standard',
      preferredBrand: 'handoff',
    });
  });

  it('maps forwarded Clerk identity into a customer profile', () => {
    const service = new CustomersService();

    const result = service.getCurrentCustomer({
      clerkUserId: 'user_123',
      displayName: 'Alex Driver',
      email: 'alex@example.com',
    });

    expect(result).toEqual({
      id: 'user_123',
      displayName: 'Alex Driver',
      email: 'alex@example.com',
      loyaltyTier: 'gold',
      preferredBrand: 'handoff',
    });
  });
});
