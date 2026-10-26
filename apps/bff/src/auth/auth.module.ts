import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';
import { SameOriginGuard } from './same-origin.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, SameOriginGuard],
  exports: [AuthService, SessionGuard, SameOriginGuard],
})
export class AuthModule {}
