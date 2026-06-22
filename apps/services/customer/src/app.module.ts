import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { CustomersModule } from "./customers/customers.module";

@Module({
  imports: [CustomersModule],
  controllers: [AppController],
})
export class AppModule {}
