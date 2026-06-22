import { Controller, Get, Param } from "@nestjs/common";
import { type CustomerProfile } from "@handoff/contracts";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get(":customerId/profile")
  getCustomerProfile(@Param("customerId") customerId: string): CustomerProfile {
    return this.customersService.getCustomerProfile(customerId);
  }
}
