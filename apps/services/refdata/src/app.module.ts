import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [VehiclesModule, BookingsModule, LocationsModule],
  controllers: [AppController],
})
export class AppModule {}
