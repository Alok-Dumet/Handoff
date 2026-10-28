import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  IdentityLoginSchema,
  IdentityRegisterSchema,
  IdentityTokenSchema,
} from "@handoff/contracts";
import { AuthService } from "./auth/auth.service";
import { PrismaService } from "./prisma/prisma.service";
import { ServiceGuard } from "./service.guard";
@Controller("internal/auth")
@UseGuards(ServiceGuard)
export class IdentityController {
  constructor(private readonly auth: AuthService) {}
  @Post("register")
  @Header("Cache-Control", "no-store")
  register(@Body() body: unknown) {
    const parsed = IdentityRegisterSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.auth.register(parsed.data.input, parsed.data.token);
  }
  @Post("login")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  login(@Body() body: unknown) {
    const parsed = IdentityLoginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.auth.login(parsed.data.input, parsed.data.token);
  }
  @Post("session")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async session(@Body() body: unknown) {
    const parsed = IdentityTokenSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return { user: await this.auth.currentUser(parsed.data.token) };
  }
  @Post("logout")
  @HttpCode(204)
  @Header("Cache-Control", "no-store")
  logout(@Body() body: unknown) {
    const parsed = IdentityTokenSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.auth.logout(parsed.data.token);
  }
}
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", service: "identity" };
  }
}
