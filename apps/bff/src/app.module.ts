import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GeocodeModule } from './geocode/geocode.module';
import { LocationsModule } from './locations/locations.module';
import { PricingModule } from './pricing/pricing.module';
import { BookingsModule } from './bookings/bookings.module';
import { JourneysModule } from './journeys/journeys.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ReservationsModule } from './reservations/reservations.module';
import { RentalsModule } from './rentals/rentals.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    VehiclesModule,
    GeocodeModule,
    LocationsModule,
    PricingModule,
    BookingsModule,
    JourneysModule,
    AuthModule,
    CustomersModule,
    ReservationsModule,
    RentalsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
