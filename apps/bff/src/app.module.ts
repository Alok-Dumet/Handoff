import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { JourneysModule } from './journeys/journeys.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ReservationsModule } from './reservations/reservations.module';
import { RentalsModule } from './rentals/rentals.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    VehiclesModule,
    BookingsModule,
    JourneysModule,
    ContentModule,
    AuthModule,
    CustomersModule,
    ReservationsModule,
    RentalsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
