import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { RentalGatewayController } from './rental-gateway.controller';
import { RentalClient } from './rental-client';
@Module({
  imports: [AuthModule],
  controllers: [AppController, RentalGatewayController],
  providers: [RentalClient],
})
export class AppModule {}
