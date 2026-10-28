import "dotenv/config";
import { PrismaService } from "./prisma/prisma.service";
import { seedDemoAccount } from "./auth/demo-account";
async function main() {
  const prisma = new PrismaService();
  try {
    await seedDemoAccount(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
void main().catch(() => {
  console.error("Identity seed failed");
  process.exitCode = 1;
});
