import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { databaseUrl } from '../database-url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Prisma 7 requires a driver adapter (no built-in engine connection).
// This wraps PrismaClient as an injectable Nest provider with lifecycle hooks.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: databaseUrl() }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onApplicationShutdown() {
    // Email workers finish OnModuleDestroy before their final DB connection closes.
    await this.$disconnect();
  }
}
