import { Controller, Get } from '@nestjs/common';
import { type AuthSession } from '@handoff/contracts';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('session')
  getSession(): AuthSession {
    return this.authService.getSession();
  }
}
