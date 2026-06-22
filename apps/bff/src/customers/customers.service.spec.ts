jest.mock('@handoff/contracts', () => ({
  CustomerProfileSchema: { parse: (value: unknown) => value },
}));

import { HttpException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fetches an anonymous customer profile from the customer service', async () => {
    const service = new CustomersService();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'anonymous_customer',
          displayName: 'HandOff Customer',
          email: 'anonymous_customer@customers.handoff.local',
          loyaltyTier: 'standard',
          preferredBrand: 'handoff',
        }),
    });
    global.fetch = fetchMock;

    const result = await service.getCurrentCustomer();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3003/customers/anonymous_customer/profile',
    );

    expect(result).toEqual({
      id: 'anonymous_customer',
      displayName: 'HandOff Customer',
      email: 'anonymous_customer@customers.handoff.local',
      loyaltyTier: 'standard',
      preferredBrand: 'handoff',
    });
  });

  it('overlays trusted Clerk identity on the service profile', async () => {
    const service = new CustomersService();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'user_123',
          displayName: 'HandOff Customer',
          email: 'user_123@customers.handoff.local',
          loyaltyTier: 'standard',
          preferredBrand: 'handoff',
        }),
    });
    global.fetch = fetchMock;

    const result = await service.getCurrentCustomer({
      clerkUserId: 'user_123',
      displayName: 'Alex Driver',
      email: 'alex@example.com',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3003/customers/user_123/profile',
    );

    expect(result).toEqual({
      id: 'user_123',
      displayName: 'Alex Driver',
      email: 'alex@example.com',
      loyaltyTier: 'standard',
      preferredBrand: 'handoff',
    });
  });

  it('preserves customer service error status codes', async () => {
    const service = new CustomersService();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ message: 'customer unavailable' }),
    });

    await expect(service.getCurrentCustomer()).rejects.toMatchObject({
      response: { message: 'customer unavailable' },
      status: 503,
    } satisfies Partial<HttpException>);
  });
});
