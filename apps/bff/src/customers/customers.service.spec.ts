jest.mock('@handoff/contracts', () => ({
  CustomerProfileSchema: { parse: (value: unknown) => value },
}));

import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  it('returns a typed mock customer profile', () => {
    const service = new CustomersService();

    const result = service.getCurrentCustomer();

    expect(result).toEqual({
      id: 'customer_demo_001',
      displayName: 'Demo Customer',
      email: 'demo.customer@example.com',
      loyaltyTier: 'gold',
      preferredBrand: 'handoff',
    });
  });
});
