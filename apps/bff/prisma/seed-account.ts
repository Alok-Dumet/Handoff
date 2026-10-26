import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { databaseUrl } from '../src/database-url.js';
import { seedDemoAccount } from '../src/auth/demo-account.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl() }),
});
seedDemoAccount(prisma)
  .then(() => console.log('Demo account ready (existing accounts unchanged).'))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
