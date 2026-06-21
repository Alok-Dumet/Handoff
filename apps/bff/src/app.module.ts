import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { JourneysModule } from './journeys/journeys.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [VehiclesModule, BookingsModule, JourneysModule, ContentModule],
  controllers: [AppController],
})
export class AppModule {}
