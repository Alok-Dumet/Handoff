import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const cwd = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module.js');
const { PrismaService } = require('../dist/prisma/prisma.service.js');
const { databaseUrl } = require('../dist/database-url.js');
const contracts = require('@handoff/contracts');
const containerName = `handoff-api-test-${randomUUID()}`;
let containerId;
let app;
let base;
let savedBooking;

function run(command, args) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      timeout: 60_000,
      stdio: 'pipe',
    }).trim();
  } catch (error) {
    throw new Error(
      `${command} ${args[0]} failed: ${error.stderr || error.message}`,
      { cause: error },
    );
  }
}

async function startApi() {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
}

before(
  async () => {
    // A disposable, randomly named container: never connect to a user's database.
    containerId = run('docker', [
      'run',
      '--rm',
      '-d',
      '--name',
      containerName,
      '-e',
      'POSTGRES_USER=handoff_test',
      '-e',
      'POSTGRES_PASSWORD=handoff_test',
      '-e',
      'POSTGRES_DB=handoff_test',
      '-p',
      '127.0.0.1::5432',
      'postgres:17',
    ]);
    const inspect = JSON.parse(run('docker', ['inspect', containerId]))[0];
    const port = inspect.NetworkSettings.Ports['5432/tcp'][0].HostPort;
    process.env.DATABASE_URL = `postgresql://handoff_test:handoff_test@127.0.0.1:${port}/handoff_test`;
    process.env.NODE_ENV = 'test';
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        run('docker', [
          'exec',
          containerId,
          'pg_isready',
          '-U',
          'handoff_test',
          '-d',
          'handoff_test',
        ]);
        ready = true;
        break;
      } catch {
        await delay(250);
      }
    }
    assert.ok(ready, 'Test PostgreSQL did not become ready');
    const prismaCli = resolve(
      dirname(require.resolve('prisma/package.json')),
      'build/index.js',
    );
    run(process.execPath, [prismaCli, 'migrate', 'deploy']);
    run(process.execPath, [require.resolve('tsx/cli'), 'prisma/seed.ts']);
    await startApi();
  },
  { timeout: 120_000 },
);

after(async () => {
  try {
    await app?.close();
  } finally {
    if (containerId) run('docker', ['rm', '-f', '-v', containerId]);
  }
});

async function request(path, status = 200, body, method = 'GET') {
  const response = await fetch(`${base}${path}`, {
    method,
    signal: AbortSignal.timeout(10_000),
    ...(body !== undefined && {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  const result = await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${JSON.stringify(result)}`,
  );
  return result;
}

test('database configuration works locally but requires explicit production credentials', () => {
  assert.match(databaseUrl({}), /localhost:5432\/refdata$/);
  assert.equal(
    databaseUrl({ DATABASE_URL: 'custom', NODE_ENV: 'production' }),
    'custom',
  );
  assert.throws(() => databaseUrl({ NODE_ENV: 'production' }), /DATABASE_URL/);
});

test('single API serves validated inventory, details, locations and static catalog', async () => {
  assert.equal((await request('/health')).status, 'ok');
  const vehicles = contracts.VehicleSummaryListSchema.parse(
    await request('/vehicles'),
  );
  assert.equal(vehicles.length, 10);
  const detail = contracts.VehicleDetailSchema.parse(
    await request(`/vehicles/${vehicles[0].id}`),
  );
  assert.equal(detail.id, vehicles[0].id);
  assert.ok(
    contracts.LocationListSchema.parse(await request('/locations')).length > 0,
  );
  contracts.PurchaseCatalogSchema.parse(await request('/catalog'));
  contracts.RentalTermsSchema.parse(await request('/terms'));
  assert.ok((await request('/geocode?q=Boston')).length > 0);
  await request('/vehicles/not-a-vehicle', 404);
});

test('filters and ordering use the advertised discounted price', async () => {
  await app
    .get(PrismaService)
    .vehicle.update({
      where: { id: 'veh_005' },
      data: { salePricePerDay: 79 },
    });
  const cheap = await request('/vehicles?maxPricePerDay=80&sort=price_asc');
  assert.ok(cheap.some((v) => v.id === 'veh_005' && v.pricePerDay === 79));
  assert.ok(cheap.every((v) => v.pricePerDay <= 80));
  assert.deepEqual(
    cheap.map((v) => v.pricePerDay),
    cheap.map((v) => v.pricePerDay).sort((a, b) => a - b),
  );
  const expensive = await request('/vehicles?minPricePerDay=90');
  assert.ok(!expensive.some((v) => v.id === 'veh_005'));
  const suvs = await request('/vehicles?classes=suv&minSeats=7');
  assert.ok(
    suvs.length > 0 && suvs.every((v) => v.class === 'suv' && v.seats >= 7),
  );
  await request('/vehicles?minPricePerDay=abc', 400);
  await request('/geocode?q=Boston&q=LA', 400);
});

test('quotes retain sale pricing, extras, rounding and invalid-window validation', async () => {
  const params = new URLSearchParams({
    vehicleId: 'veh_005',
    pickupAt: '2027-01-01T10:00',
    dropoffAt: '2027-01-03T10:00',
    protectionPlanId: 'protection_basic',
  });
  params.append('addOnIds', 'gps');
  params.append('addOnIds', 'gps');
  const quote = contracts.QuoteSchema.parse(await request(`/quote?${params}`));
  assert.equal(quote.days, 2);
  assert.equal(quote.subtotalCents, 15_800 + 3_800 + 1_600);
  assert.equal(quote.taxCents, Math.round(quote.subtotalCents * 0.095));
  assert.equal(quote.totalCents, quote.subtotalCents + quote.taxCents);
  params.set('dropoffAt', '2027-01-01T09:00');
  await request(`/quote?${params}`, 400);
  params.set('dropoffAt', '2027-01-03T10:00');
  params.set('addOnIds', 'unknown');
  await request(`/quote?${params}`, 400);
  params.delete('addOnIds');
  params.set('vehicleId', 'unknown');
  await request(`/quote?${params}`, 404);
});

test('basic booking persists, keeps the response envelope, and rejects overlaps', async () => {
  const input = {
    vehicleId: 'veh_001',
    customerName: 'Integration Test',
    customerEmail: 'test@example.com',
    startDate: '2027-02-01',
    endDate: '2027-02-03',
  };
  const response = contracts.BookingCreationResponseSchema.parse(
    await request('/bookings', 201, input, 'POST'),
  );
  savedBooking = response.booking;
  assert.equal(response.nextJourney, null);
  assert.deepEqual(response.alternatives, []);
  assert.deepEqual(await request(`/bookings/${savedBooking.id}`), savedBooking);
  assert.ok((await request('/bookings')).some((b) => b.id === savedBooking.id));
  await request('/bookings', 409, input, 'POST');
  await request(
    '/bookings',
    400,
    { ...input, endDate: input.startDate },
    'POST',
  );
  await request('/bookings', 400, {}, 'POST');
  await request('/bookings', 404, { ...input, vehicleId: 'missing' }, 'POST');
  await request('/bookings/missing', 404);
});

test('removed mock and duplicate endpoints return 404', async () => {
  for (const path of [
    '/auth/session',
    '/customers/me',
    '/reservations',
    '/reservations/anything',
    '/rentals/current',
    '/journeys/pre-check-in/anything',
    '/journeys/identity-verification/anything',
    '/journeys/e-receipt/anything',
    '/journeys/vehicle-upgrade/anything',
  ]) {
    await request(path, 404);
  }
  for (const path of [
    '/payments/reservation-sessions',
    '/payments/stripe/webhook',
    '/journeys/resolve',
    '/journeys/pre-check-in',
    '/journeys/identity-verification/start',
    '/journeys/identity-verification/status',
    '/journeys/e-receipt/delivery-preference',
    '/journeys/vehicle-upgrade/select',
    '/journeys/vehicle-upgrade/confirm',
  ]) {
    await request(path, 404, {}, 'POST');
  }
});

test('bookings survive API restart', async () => {
  assert.ok(savedBooking);
  await app.close();
  await startApi();
  assert.deepEqual(await request(`/bookings/${savedBooking.id}`), savedBooking);
});
