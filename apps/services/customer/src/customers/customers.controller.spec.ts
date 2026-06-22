import { CustomerProfileSchema } from "@handoff/contracts";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

describe("CustomersController", () => {
  const controller = new CustomersController(new CustomersService());

  it("returns a contract-valid profile for the given id", () => {
    const result = controller.getCustomerProfile("customer_demo_001");

    expect(result.id).toBe("customer_demo_001");
    expect(CustomerProfileSchema.safeParse(result).success).toBe(true);
  });

  it("returns a contract-valid fallback profile for unknown ids", () => {
    const result = controller.getCustomerProfile("unknown_user");

    expect(CustomerProfileSchema.safeParse(result).success).toBe(true);
  });
});
