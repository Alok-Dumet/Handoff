import { Injectable } from '@nestjs/common';
import {
  CustomerProfileSchema,
  type CustomerProfile,
} from '@handoff/contracts';

@Injectable()
export class CustomersService {
  getCurrentCustomer(): CustomerProfile {
    return CustomerProfileSchema.parse({
      id: 'customer_demo_001',
      displayName: 'Demo Customer',
      email: 'demo.customer@example.com',
      loyaltyTier: 'gold',
      preferredBrand: 'handoff',
    });
  }
}
