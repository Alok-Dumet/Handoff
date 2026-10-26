import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GeocodeModule } from './geocode/geocode.module';
import { LocationsModule } from './locations/locations.module';
import { PricingModule } from './pricing/pricing.module';
import { CatalogModule } from './catalog/catalog.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    VehiclesModule,
    GeocodeModule,
    LocationsModule,
    PricingModule,
    CatalogModule,
    BookingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
