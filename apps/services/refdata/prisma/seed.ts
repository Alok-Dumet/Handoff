import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { type Vehicle, VehicleListSchema } from '@handoff/contracts';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Seed data validated against the shared contract — the seed can't drift from the schema.
const VEHICLES: Vehicle[] = VehicleListSchema.parse([
  {
    id: 'veh_001',
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    class: 'economy',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 42,
  },
  {
    id: 'veh_002',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2023,
    class: 'compact',
    transmission: 'manual',
    seats: 5,
    pricePerDay: 48,
  },
  {
    id: 'veh_003',
    make: 'Tesla',
    model: 'Model 3',
    year: 2025,
    class: 'premium',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 95,
  },
  {
    id: 'veh_004',
    make: 'Jeep',
    model: 'Wrangler',
    year: 2024,
    class: 'suv',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 78,
  },
]);

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  for (const v of VEHICLES) {
    // Idempotent: re-running the seed updates rather than duplicating.
    await prisma.vehicle.upsert({
      where: { id: v.id },
      update: v,
      create: v,
    });
  }

  const count = await prisma.vehicle.count();
  console.log(`Seeded vehicles. Total in table: ${count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
