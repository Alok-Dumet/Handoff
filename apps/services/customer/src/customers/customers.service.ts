import { Injectable } from "@nestjs/common";
import {
  CustomerProfileSchema,
  type CustomerProfile,
} from "@handoff/contracts";

const seededProfiles = new Map<string, CustomerProfile>([
  [
    "customer_demo_001",
    {
      id: "customer_demo_001",
      displayName: "Demo Customer",
      email: "demo.customer@example.com",
      loyaltyTier: "gold",
      preferredBrand: "handoff",
    },
  ],
]);

@Injectable()
export class CustomersService {
  getCustomerProfile(customerId: string): CustomerProfile {
    const seededProfile = seededProfiles.get(customerId);

    if (seededProfile) {
      return CustomerProfileSchema.parse(seededProfile);
    }

    return CustomerProfileSchema.parse({
      id: customerId,
      displayName: "HandOff Customer",
      email: `${customerId}@customers.handoff.local`,
      loyaltyTier: "standard",
      preferredBrand: "handoff",
    });
  }
}
