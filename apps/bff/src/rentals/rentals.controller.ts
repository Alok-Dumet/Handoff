import { Controller, Get } from '@nestjs/common';
import { type CurrentRental } from '@handoff/contracts';
import { RentalsService } from './rentals.service';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get('current')
  getCurrentRental(): CurrentRental {
    return this.rentalsService.getCurrentRental();
  }
}
