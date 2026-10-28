import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';
import { SameOriginGuard } from './same-origin.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, SameOriginGuard],
  exports: [AuthService, SessionGuard, SameOriginGuard],
})
export class AuthModule {}
