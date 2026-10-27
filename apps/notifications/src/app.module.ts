import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { NotificationsService } from "./notifications.service";
import {
  NotificationsController,
  HealthController,
} from "./notifications.controller";
import { ServiceGuard } from "./service.guard";
@Module({
  providers: [PrismaService, NotificationsService, ServiceGuard],
  controllers: [NotificationsController, HealthController],
})
export class AppModule {}
