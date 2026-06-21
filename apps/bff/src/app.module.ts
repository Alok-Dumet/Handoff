import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [VehiclesModule],
  controllers: [AppController],
})
export class AppModule {}
