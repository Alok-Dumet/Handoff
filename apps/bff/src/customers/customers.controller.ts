import { Controller, Get, Headers } from '@nestjs/common';
import { type CustomerProfile } from '@handoff/contracts';
import { CustomersService } from './customers.service';
import { type ClerkIdentityContext } from '../auth/auth.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  getCurrentCustomer(
    @Headers('x-handoff-clerk-user-id') clerkUserId?: string,
    @Headers('x-handoff-display-name') displayName?: string,
    @Headers('x-handoff-email') email?: string,
    @Headers('x-handoff-internal-secret') internalSecret?: string,
  ): CustomerProfile {
    if (!isTrustedInternalCaller(internalSecret)) {
      return this.customersService.getCurrentCustomer();
    }

    return this.customersService.getCurrentCustomer(
      decodeIdentityHeaders({ clerkUserId, displayName, email }),
    );
  }
}

function decodeIdentityHeaders(
  identity: ClerkIdentityContext,
): ClerkIdentityContext {
  return {
    clerkUserId: identity.clerkUserId,
    displayName: decodeHeader(identity.displayName),
    email: decodeHeader(identity.email),
  };
}

function decodeHeader(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function isTrustedInternalCaller(internalSecret?: string): boolean {
  const expectedSecret = process.env.BFF_INTERNAL_AUTH_SECRET;

  if (!expectedSecret) {
    return true;
  }

  return internalSecret === expectedSecret;
}
