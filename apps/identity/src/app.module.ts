import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { AuthService } from "./auth/auth.service";
import { IdentityController, HealthController } from "./identity.controller";
import { ServiceGuard } from "./service.guard";
@Module({
  providers: [PrismaService, AuthService, ServiceGuard],
  controllers: [IdentityController, HealthController],
})
export class AppModule {}
