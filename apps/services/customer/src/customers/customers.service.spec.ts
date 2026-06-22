import { CustomerProfileSchema } from "@handoff/contracts";
import { CustomersService } from "./customers.service";

describe("CustomersService", () => {
  const service = new CustomersService();

  it("returns a seeded customer profile", () => {
    const result = service.getCustomerProfile("customer_demo_001");

    expect(result).toEqual({
      id: "customer_demo_001",
      displayName: "Demo Customer",
      email: "demo.customer@example.com",
      loyaltyTier: "gold",
      preferredBrand: "handoff",
    });
  });

  it("returns a standard fallback profile for unknown customer ids", () => {
    const result = service.getCustomerProfile("user_123");

    expect(result).toEqual({
      id: "user_123",
      displayName: "HandOff Customer",
      email: "user_123@customers.handoff.local",
      loyaltyTier: "standard",
      preferredBrand: "handoff",
    });
  });

  // 3.2: responses must validate against the shared @handoff/contracts schema,
  // not a local copy — so these parse with the real schema.
  it("seeded profile satisfies the shared CustomerProfile contract", () => {
    const result = service.getCustomerProfile("customer_demo_001");

    expect(() => CustomerProfileSchema.parse(result)).not.toThrow();
    expect(CustomerProfileSchema.safeParse(result).success).toBe(true);
  });

  it("fallback profile satisfies the shared CustomerProfile contract", () => {
    const result = service.getCustomerProfile("some_clerk_user_id");

    const parsed = CustomerProfileSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("fallback builds a contract-valid email for arbitrary ids", () => {
    // email must remain a valid address per the contract's z.email() rule.
    const result = service.getCustomerProfile("abc-123_XYZ");

    expect(
      CustomerProfileSchema.shape.email.safeParse(result.email).success,
    ).toBe(true);
  });
});
