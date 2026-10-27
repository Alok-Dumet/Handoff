import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ConfirmationDeliverySchema } from "@handoff/contracts";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "./prisma/prisma.service";
import { ServiceGuard } from "./service.guard";
@Controller("internal/confirmations")
@UseGuards(ServiceGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Post()
  @Header("Cache-Control", "no-store")
  accept(@Body() body: unknown) {
    const parsed = ConfirmationDeliverySchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.notifications.accept(parsed.data);
  }
  @Get(":id")
  @Header("Cache-Control", "no-store")
  status(@Param("id") id: string) {
    return this.notifications.status(id);
  }
}
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", service: "notifications" };
  }
}
