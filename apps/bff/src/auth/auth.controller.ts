import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  LoginSchema,
  RegisterSchema,
  SESSION_COOKIE_NAME,
  type SessionResponse,
} from '@handoff/contracts';
import { AuthService } from './auth.service';
import { SameOriginGuard } from './same-origin.guard';
import { sessionCookieOptions, sessionToken } from './session-cookie';

@Controller('auth')
@UseGuards(SameOriginGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('session')
  @Header('Cache-Control', 'no-store')
  @Header('Vary', 'Cookie')
  async session(@Req() request: Request): Promise<SessionResponse> {
    return {
      user: await this.auth.currentUser(sessionToken(request.headers.cookie)),
    };
  }

  @Post('register')
  @Header('Cache-Control', 'no-store')
  async register(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    const result = await this.auth.register(
      parsed.data,
      sessionToken(request.headers.cookie),
    );
    response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions());
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    const result = await this.auth.login(
      parsed.data,
      sessionToken(request.headers.cookie),
    );
    response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions());
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(sessionToken(request.headers.cookie));
    const options = sessionCookieOptions();
    delete options.maxAge;
    response.clearCookie(SESSION_COOKIE_NAME, options);
  }
}
