import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { JourneysModule } from './journeys/journeys.module';

@Module({
  imports: [VehiclesModule, BookingsModule, JourneysModule],
  controllers: [AppController],
})
export class AppModule {}
