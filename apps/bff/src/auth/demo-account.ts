import type { PrismaClient } from '../generated/prisma/client';
import { hashPassword } from './password';

export async function seedDemoAccount(prisma: PrismaClient): Promise<void> {
  await prisma.user.upsert({
    where: { email: 'demo@handoff.local' },
    update: {},
    create: {
      name: 'Demo Driver',
      email: 'demo@handoff.local',
      passwordHash: await hashPassword('DemoRental123!'),
    },
  });
}
