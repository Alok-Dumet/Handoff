import { Controller, Get, Param } from '@nestjs/common';
import {
  type ReservationDetail,
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

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ReservationDetail> {
    return this.reservationsService.findOne(id);
  }
}
