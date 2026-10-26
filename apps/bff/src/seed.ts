import 'dotenv/config';
import { databaseUrl } from './database-url.js';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  type Location,
  type VehicleCreate,
  LocationListSchema,
  VehicleCreateSchema,
} from '@handoff/contracts';
import { PrismaClient } from './generated/prisma/client.js';
import { seedDemoAccount } from './auth/demo-account.js';

// Pick-up branches. Validated against the shared contract so seed data
// can't drift from the schema.
const LOCATIONS: Location[] = LocationListSchema.parse([
  {
    id: 'loc_lax',
    name: 'Los Angeles Airport',
    address: '1 World Way, Los Angeles, CA 90045',
    latitude: 33.9416,
    longitude: -118.4085,
  },
  {
    id: 'loc_dtla',
    name: 'Downtown LA',
    address: '350 S Grand Ave, Los Angeles, CA 90071',
    latitude: 34.0537,
    longitude: -118.2522,
  },
  {
    id: 'loc_sfo',
    name: 'San Francisco Airport',
    address: 'San Francisco, CA 94128',
    latitude: 37.6213,
    longitude: -122.379,
  },
  {
    id: 'loc_sjc',
    name: 'San Jose Downtown',
    address: '150 W San Carlos St, San Jose, CA 95113',
    latitude: 37.3308,
    longitude: -121.889,
  },
]);

// 10 vehicles across the four classes, each tied to a pick-up location.
const VEHICLES: VehicleCreate[] = VehicleCreateSchema.array().parse([
  {
    id: 'veh_001',
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    class: 'economy',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 42,
    locationId: 'loc_lax',
  },
  {
    id: 'veh_002',
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    class: 'economy',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 45,
    locationId: 'loc_dtla',
  },
  {
    id: 'veh_003',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2023,
    class: 'compact',
    transmission: 'manual',
    seats: 5,
    pricePerDay: 48,
    locationId: 'loc_sfo',
  },
  {
    id: 'veh_004',
    make: 'Mazda',
    model: '3',
    year: 2024,
    class: 'compact',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 52,
    locationId: 'loc_sjc',
  },
  {
    id: 'veh_005',
    make: 'Tesla',
    model: 'Model 3',
    year: 2025,
    class: 'premium',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 95,
    salePricePerDay: 79,
    locationId: 'loc_lax',
  },
  {
    id: 'veh_006',
    make: 'BMW',
    model: '3 Series',
    year: 2024,
    class: 'premium',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 105,
    locationId: 'loc_dtla',
  },
  {
    id: 'veh_007',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2025,
    class: 'premium',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 112,
    locationId: 'loc_sfo',
  },
  {
    id: 'veh_008',
    make: 'Jeep',
    model: 'Wrangler',
    year: 2024,
    class: 'suv',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 78,
    locationId: 'loc_sjc',
  },
  {
    id: 'veh_009',
    make: 'Toyota',
    model: 'RAV4',
    year: 2024,
    class: 'suv',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 72,
    salePricePerDay: 59,
    locationId: 'loc_lax',
  },
  {
    id: 'veh_010',
    make: 'Ford',
    model: 'Explorer',
    year: 2023,
    class: 'suv',
    transmission: 'automatic',
    seats: 7,
    pricePerDay: 88,
    locationId: 'loc_dtla',
  },
]);

async function main() {
  const adapter = new PrismaPg({ connectionString: databaseUrl() });
  const prisma = new PrismaClient({ adapter });
  await seedDemoAccount(prisma);

  // Locations first — vehicles reference them by foreign key.
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: {},
      create: loc,
    });
  }

  for (const v of VEHICLES) {
    // Startup only inserts missing fixtures; preserve existing prices and edits.
    await prisma.vehicle.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }

  const count = await prisma.vehicle.count();
  console.log(`Demo inventory ready. Total vehicles: ${count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
