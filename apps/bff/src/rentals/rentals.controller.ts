import { Controller, Get, Query } from '@nestjs/common';
import { type CurrentRental } from '@handoff/contracts';
import { RentalsService } from './rentals.service';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get('current')
  getCurrentRental(
    @Query('reservationId') reservationId?: string,
  ): Promise<CurrentRental> {
    return this.rentalsService.getCurrentRental(reservationId);
  }
}
