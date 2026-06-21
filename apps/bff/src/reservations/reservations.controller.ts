import { Controller, Get } from '@nestjs/common';
import { type ReservationSummary } from '@handoff/contracts';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('summary')
  getSummary(): ReservationSummary {
    return this.reservationsService.getSummary();
  }
}
