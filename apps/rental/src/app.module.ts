import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ServiceGuard } from "./service.guard";
import { AppController } from "./app.controller";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { GeocodeModule } from "./geocode/geocode.module";
import { LocationsModule } from "./locations/locations.module";
import { PricingModule } from "./pricing/pricing.module";
import { CatalogModule } from "./catalog/catalog.module";
import { BookingsModule } from "./bookings/bookings.module";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VehiclesModule,
    GeocodeModule,
    LocationsModule,
    PricingModule,
    CatalogModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ServiceGuard }],
})
export class AppModule {}
