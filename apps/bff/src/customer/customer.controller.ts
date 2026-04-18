import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/customer')
export class CustomerController {
  @Get(':id')
  getCustomer(@Param('id') id: string) {
    return {
      id: 'cust-001',
      name: 'Alok Sharma',
      email: 'alok@example.com',
      loyaltyTier: 'Gold',
      biometricConsented: false,
    };
  }
}
