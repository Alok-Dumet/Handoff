import { Injectable } from '@nestjs/common';
import {
  CustomerProfileSchema,
  type CustomerProfile,
} from '@handoff/contracts';
import { type ClerkIdentityContext } from '../auth/auth.service';

@Injectable()
export class CustomersService {
  getCurrentCustomer(identity: ClerkIdentityContext = {}): CustomerProfile {
    return CustomerProfileSchema.parse({
      id: identity.clerkUserId ?? 'anonymous_customer',
      displayName: identity.displayName ?? 'Guest Customer',
      email: identity.email ?? 'guest@example.com',
      loyaltyTier: identity.clerkUserId ? 'gold' : 'standard',
      preferredBrand: 'handoff',
    });
  }
}
