import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [VehiclesModule, BookingsModule],
  controllers: [AppController],
})
export class AppModule {}
