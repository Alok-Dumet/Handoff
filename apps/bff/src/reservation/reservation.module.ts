import { Module } from '@nestjs/common';
import { ReservationController } from './reservation.controller';

@Module({
  controllers: [ReservationController],
})
export class ReservationModule {}
