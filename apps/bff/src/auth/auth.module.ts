import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SameOriginGuard } from './same-origin.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SameOriginGuard],
  exports: [AuthService, SameOriginGuard],
})
export class AuthModule {}
