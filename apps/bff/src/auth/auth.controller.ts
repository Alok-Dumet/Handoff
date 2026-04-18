import { Controller, Post } from '@nestjs/common';

@Controller('api/auth')
export class AuthController {
  @Post('session')
  createSession() {
    return {
      token: 'mock-jwt-token-abc123',
      expiresIn: 3600,
    };
  }
}
