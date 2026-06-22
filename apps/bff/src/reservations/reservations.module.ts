import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { BookingsModule } from '../bookings/bookings.module';
import { JourneysModule } from '../journeys/journeys.module';

@Module({
  imports: [BookingsModule, JourneysModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
