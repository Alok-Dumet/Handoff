import { Controller, Get } from '@nestjs/common';
import { type CustomerProfile } from '@handoff/contracts';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  getCurrentCustomer(): CustomerProfile {
    return this.customersService.getCurrentCustomer();
  }
}
