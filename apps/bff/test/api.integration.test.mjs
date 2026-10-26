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
let aliceCookie;
let alice;
let bobCookie;

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
    process.env.WEB_ORIGIN = 'http://localhost:3000';
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

async function rawRequest(
  path,
  body,
  method = 'GET',
  cookie = '',
  extraHeaders = {},
) {
  return fetch(`${base}${path}`, {
    method,
    signal: AbortSignal.timeout(10_000),
    headers: {
      ...(cookie && { Cookie: cookie }),
      ...(body !== undefined && {
        'content-type': 'application/json',
        Origin: 'http://localhost:3000',
        'X-Handoff-CSRF': '1',
      }),
      ...extraHeaders,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

async function request(path, status = 200, body, method = 'GET', cookie = '') {
  const response = await rawRequest(path, body, method, cookie);
  const result = response.status === 204 ? null : await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${JSON.stringify(result)}`,
  );
  return result;
}

async function signIn(body, path = '/auth/login', cookie = '') {
  const response = await rawRequest(path, body, 'POST', cookie);
  assert.equal(
    response.status,
    path.endsWith('register') ? 201 : 200,
    await response.clone().text(),
  );
  const result = contracts.SessionResponseSchema.parse(await response.json());
  const header = response.headers.get('set-cookie');
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  assert.match(header, /Max-Age=604800/);
  assert.ok(!header.includes('Domain='));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return { user: result.user, cookie: header.split(';')[0] };
}

test('registration persists normalized accounts and hashed credentials without leaking secrets', async () => {
  const session = await signIn(
    {
      name: ' Alice Driver ',
      email: ' ALICE@example.com ',
      password: 'AlicePassword123!',
    },
    '/auth/register',
  );
  alice = session.user;
  aliceCookie = session.cookie;
  assert.equal(alice.name, 'Alice Driver');
  assert.equal(alice.email, 'alice@example.com');
  assert.deepEqual(Object.keys(alice).sort(), ['email', 'id', 'name']);
  const stored = await app
    .get(PrismaService)
    .user.findUnique({ where: { id: alice.id } });
  assert.match(stored.passwordHash, /^scrypt\$/);
  assert.notEqual(stored.passwordHash, 'AlicePassword123!');
  const sessions = await app
    .get(PrismaService)
    .session.findMany({ where: { userId: alice.id } });
  assert.equal(sessions.length, 1);
  assert.notEqual(sessions[0].tokenHash, aliceCookie.split('=')[1]);
  assert.deepEqual(
    await request('/auth/session', 200, undefined, 'GET', aliceCookie),
    { user: alice },
  );
  const duplicate = {
    name: 'Other person',
    email: 'ALICE@example.com',
    password: 'AnotherPassword123!',
  };
  await request('/auth/register', 409, duplicate, 'POST');
  await request(
    '/auth/register',
    400,
    { ...duplicate, email: 'invalid' },
    'POST',
  );
  await request(
    '/auth/register',
    400,
    { ...duplicate, password: 'short' },
    'POST',
  );
});

test('login validates credentials, rotates the current session, and ignores spoofed identity headers', async () => {
  await request(
    '/auth/login',
    401,
    { email: alice.email, password: 'WrongPassword123!' },
    'POST',
  );
  await request(
    '/auth/login',
    401,
    { email: 'unknown@example.com', password: 'WrongPassword123!' },
    'POST',
  );
  const previous = aliceCookie;
  const session = await signIn(
    { email: 'ALICE@example.com', password: 'AlicePassword123!' },
    '/auth/login',
    previous,
  );
  aliceCookie = session.cookie;
  assert.notEqual(aliceCookie, previous);
  assert.deepEqual(
    await request('/auth/session', 200, undefined, 'GET', previous),
    { user: null },
  );
  const forged = await rawRequest('/auth/session', undefined, 'GET', '', {
    'x-handoff-clerk-user-id': alice.id,
    'x-handoff-email': alice.email,
  });
  assert.deepEqual(await forged.json(), { user: null });
  assert.equal(forged.headers.get('cache-control'), 'no-store');
});

test('cross-origin and non-JSON authentication requests are rejected', async () => {
  const body = { email: alice.email, password: 'AlicePassword123!' };
  for (const headers of [
    { Origin: 'https://evil.example' },
    { Origin: '' },
    { 'X-Handoff-CSRF': '' },
    { 'content-type': 'text/plain' },
  ]) {
    const result = await rawRequest('/auth/login', body, 'POST', '', headers);
    assert.equal(result.status, 403);
    assert.equal(result.headers.get('set-cookie'), null);
  }
  const logout = await rawRequest('/auth/logout', {}, 'POST', aliceCookie, {
    Origin: 'https://evil.example',
  });
  assert.equal(logout.status, 403);
  assert.deepEqual(
    await request('/auth/session', 200, undefined, 'GET', aliceCookie),
    { user: alice },
  );
});

test('demo account is usable and reseeding does not overwrite existing credentials', async () => {
  const demo = await signIn({
    email: 'demo@handoff.local',
    password: 'DemoRental123!',
  });
  const prisma = app.get(PrismaService);
  const before = await prisma.user.findUnique({ where: { id: demo.user.id } });
  const { seedDemoAccount } = require('../dist/auth/demo-account.js');
  await seedDemoAccount(prisma);
  const after = await prisma.user.findUnique({ where: { id: demo.user.id } });
  assert.equal(after.passwordHash, before.passwordHash);
  await request('/auth/logout', 204, {}, 'POST', demo.cookie);
});

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
  await app.get(PrismaService).vehicle.update({
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
    await request('/bookings', 201, input, 'POST', aliceCookie),
  );
  savedBooking = response.booking;
  assert.equal(savedBooking.customerName, alice.name);
  assert.equal(savedBooking.customerEmail, alice.email);
  assert.equal(response.nextJourney, null);
  assert.deepEqual(response.alternatives, []);
  assert.deepEqual(
    await request(
      `/bookings/${savedBooking.id}`,
      200,
      undefined,
      'GET',
      aliceCookie,
    ),
    savedBooking,
  );
  assert.ok(
    (await request('/bookings', 200, undefined, 'GET', aliceCookie)).some(
      (b) => b.id === savedBooking.id,
    ),
  );
  await request('/bookings', 409, input, 'POST', aliceCookie);
  await request(
    '/bookings',
    400,
    { ...input, endDate: input.startDate },
    'POST',
    aliceCookie,
  );
  await request('/bookings', 400, {}, 'POST', aliceCookie);
  await request(
    '/bookings',
    404,
    { ...input, vehicleId: 'missing' },
    'POST',
    aliceCookie,
  );
  await request('/bookings/missing', 404, undefined, 'GET', aliceCookie);
});

test('booking access is owner-scoped and never claims legacy bookings by email', async () => {
  bobCookie = (
    await signIn(
      {
        name: 'Bob Driver',
        email: 'bob@example.com',
        password: 'BobPassword123!',
      },
      '/auth/register',
    )
  ).cookie;
  await request('/bookings', 401);
  await request(`/bookings/${savedBooking.id}`, 401);
  await request('/bookings', 401, {}, 'POST');
  await request(
    `/bookings/${savedBooking.id}`,
    404,
    undefined,
    'GET',
    bobCookie,
  );
  assert.deepEqual(
    await request('/bookings', 200, undefined, 'GET', bobCookie),
    [],
  );
  const legacy = await app.get(PrismaService).booking.create({
    data: {
      id: 'legacy-unowned',
      vehicleId: 'veh_002',
      customerName: alice.name,
      customerEmail: alice.email,
      startDate: new Date('2027-05-01'),
      endDate: new Date('2027-05-03'),
    },
  });
  await request(`/bookings/${legacy.id}`, 404, undefined, 'GET', aliceCookie);
  const owned = await request('/bookings', 200, undefined, 'GET', aliceCookie);
  assert.ok(!owned.some((booking) => booking.id === legacy.id));
  const crossOrigin = await rawRequest(
    '/bookings',
    { vehicleId: 'veh_003', startDate: '2027-05-01', endDate: '2027-05-03' },
    'POST',
    aliceCookie,
    { Origin: 'https://evil.example' },
  );
  assert.equal(crossOrigin.status, 403);
});

test('removed mock and duplicate endpoints return 404', async () => {
  for (const path of [
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

test('accounts, sessions and owned bookings survive API restart', async () => {
  assert.ok(savedBooking);
  await app.close();
  await startApi();
  assert.deepEqual(
    await request('/auth/session', 200, undefined, 'GET', aliceCookie),
    { user: alice },
  );
  assert.deepEqual(
    await request(
      `/bookings/${savedBooking.id}`,
      200,
      undefined,
      'GET',
      aliceCookie,
    ),
    savedBooking,
  );
});

test('expired and forged sessions cannot authenticate, and logout revokes server-side access', async () => {
  const prisma = app.get(PrismaService);
  const { tokenHash } = require('../dist/auth/session-cookie.js');
  await prisma.session.update({
    where: { tokenHash: tokenHash(bobCookie.split('=')[1]) },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  assert.deepEqual(
    await request('/auth/session', 200, undefined, 'GET', bobCookie),
    { user: null },
  );
  await request('/bookings', 401, undefined, 'GET', bobCookie);
  assert.deepEqual(
    await request(
      '/auth/session',
      200,
      undefined,
      'GET',
      `handoff_session=${'f'.repeat(64)}`,
    ),
    { user: null },
  );
  const response = await rawRequest('/auth/logout', {}, 'POST', aliceCookie);
  assert.equal(response.status, 204);
  assert.match(response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  assert.deepEqual(
    await request('/auth/session', 200, undefined, 'GET', aliceCookie),
    { user: null },
  );
  await request('/bookings', 401, undefined, 'GET', aliceCookie);
  await request('/auth/logout', 204, {}, 'POST', aliceCookie);
});
