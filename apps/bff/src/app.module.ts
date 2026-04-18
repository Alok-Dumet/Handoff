import { Module } from '@nestjs/common';
import { ReservationModule } from './reservation/reservation.module';
import { CustomerModule } from './customer/customer.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ReservationModule,
    CustomerModule,
    VehiclesModule,
    ContentModule,
    AuthModule,
  ],
})
export class AppModule {}
