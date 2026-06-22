import { Controller, Get } from '@nestjs/common';
import {
  type ReservationListItem,
  type ReservationSummary,
} from '@handoff/contracts';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findAll(): Promise<ReservationListItem[]> {
    return this.reservationsService.findAll();
  }

  @Get('summary')
  getSummary(): ReservationSummary {
    return this.reservationsService.getSummary();
  }
}
