import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { ReservationsModule } from "./reservations/reservations.module";

@Module({
  imports: [ReservationsModule],
  controllers: [AppController],
})
export class AppModule {}
