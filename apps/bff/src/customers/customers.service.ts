import { HttpException, Injectable } from '@nestjs/common';
import {
  CustomerProfileSchema,
  type CustomerProfile,
} from '@handoff/contracts';
import { type ClerkIdentityContext } from '../auth/auth.service';

@Injectable()
export class CustomersService {
  private readonly customerServiceUrl =
    process.env.CUSTOMER_SERVICE_URL ?? 'http://localhost:3003';

  async getCurrentCustomer(
    identity: ClerkIdentityContext = {},
  ): Promise<CustomerProfile> {
    const customerId = identity.clerkUserId ?? 'anonymous_customer';
    const res = await fetch(
      `${this.customerServiceUrl}/customers/${encodeURIComponent(customerId)}/profile`,
    );

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    const profile = CustomerProfileSchema.parse(await res.json());

    return CustomerProfileSchema.parse({
      ...profile,
      displayName: identity.displayName ?? profile.displayName,
      email: identity.email ?? profile.email,
    });
  }
}

async function toUpstreamException(res: Response): Promise<HttpException> {
  let body: string | Record<string, unknown> =
    `customer service responded ${res.status}`;
  try {
    const jsonBody: unknown = await res.json();
    body =
      typeof jsonBody === 'object' && jsonBody !== null
        ? (jsonBody as Record<string, unknown>)
        : String(jsonBody);
  } catch {
    // Keep the fallback body when customer service did not return JSON.
  }

  return new HttpException(body, res.status);
}
