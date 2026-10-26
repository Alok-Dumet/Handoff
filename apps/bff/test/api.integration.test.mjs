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
const { EmailService } = require('../dist/email/email.service.js');
const { databaseUrl } = require('../dist/database-url.js');
const contracts = require('@handoff/contracts');
const containerName = `handoff-api-test-${randomUUID()}`;
let containerId;
let mailContainerId;
let mailUrl;
let smtpPort;
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
    process.env.EMAIL_WORKER_ENABLED = 'false';
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_REQUIRE_TLS = 'false';
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    process.env.EMAIL_FROM = 'HandOff <no-reply@handoff.local>';
    mailContainerId = run('docker', [
      'run',
      '-d',
      '--name',
      `handoff-mail-test-${randomUUID()}`,
      '-p',
      '127.0.0.1::1025',
      '-p',
      '127.0.0.1::8025',
      '-v',
      '/data',
      '-e',
      'MP_DATABASE=/data/mailpit.db',
      '-e',
      'MP_DISABLE_VERSION_CHECK=true',
      '-e',
      'MP_IGNORE_DUPLICATE_IDS=true',
      'axllent/mailpit:v1.27.4',
    ]);
    const mail = JSON.parse(run('docker', ['inspect', mailContainerId]))[0];
    smtpPort = mail.NetworkSettings.Ports['1025/tcp'][0].HostPort;
    mailUrl = `http://127.0.0.1:${mail.NetworkSettings.Ports['8025/tcp'][0].HostPort}`;
    process.env.SMTP_PORT = smtpPort;
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
    if (mailContainerId) run('docker', ['rm', '-f', '-v', mailContainerId]);
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

async function checkoutInput(
  vehicleId = 'veh_001',
  pickupAt = '2027-02-01T10:00',
  dropoffAt = '2027-02-03T10:00',
  extra = {},
) {
  const vehicle = await request(`/vehicles/${vehicleId}`);
  const terms = await request('/terms');
  const extras = {
    pickupAt,
    dropoffAt,
    pickupLocationId: vehicle.pickupLocationId,
    dropoffLocationId: vehicle.pickupLocationId,
    addOnIds: ['gps'],
    protectionPlanId: 'protection_basic',
    acceptedTermsVersion: terms.version,
    ...extra,
  };
  const params = new URLSearchParams({
    vehicleId,
    pickupAt,
    dropoffAt,
    protectionPlanId: extras.protectionPlanId,
  });
  extras.addOnIds.forEach((id) => params.append('addOnIds', id));
  const quote = await request(`/quote?${params}`);
  return {
    vehicleId,
    requestKey: randomUUID(),
    extras,
    expectedTotalCents: quote.totalCents,
  };
}

test('checkout confirms a priced booking, ignores forged identity/prices, and safely replays retries', async () => {
  const input = {
    ...(await checkoutInput()),
    customerName: 'Integration Test',
    customerEmail: 'test@example.com',
    totalCents: 1,
  };
  const response = contracts.BookingCreationResponseSchema.parse(
    await request('/bookings', 201, input, 'POST', aliceCookie),
  );
  savedBooking = response.booking;
  assert.equal(savedBooking.customerName, alice.name);
  assert.equal(savedBooking.customerEmail, alice.email);
  assert.equal(savedBooking.status, 'confirmed');
  assert.equal(savedBooking.totalCents, input.expectedTotalCents);
  assert.deepEqual(savedBooking.extras.addOnIds, ['gps']);
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
    (await request('/bookings', 200, undefined, 'GET', aliceCookie)).items.some(
      (b) => b.id === savedBooking.id,
    ),
  );
  assert.deepEqual(
    (await request('/bookings', 201, input, 'POST', aliceCookie)).booking,
    savedBooking,
  );
  await request(
    '/bookings',
    409,
    { ...input, requestKey: randomUUID() },
    'POST',
    aliceCookie,
  );
  await request(
    '/bookings',
    409,
    { ...input, vehicleId: 'veh_002' },
    'POST',
    aliceCookie,
  );
  await request(
    '/bookings',
    400,
    { ...input, extras: { ...input.extras, dropoffAt: input.extras.pickupAt } },
    'POST',
    aliceCookie,
  );
  await request('/bookings', 400, {}, 'POST', aliceCookie);
  await request(
    '/bookings',
    404,
    { ...input, requestKey: randomUUID(), vehicleId: 'missing' },
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
    { items: [], nextCursor: null },
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
  assert.ok(!owned.items.some((booking) => booking.id === legacy.id));
  const crossOrigin = await rawRequest(
    '/bookings',
    { vehicleId: 'veh_003', startDate: '2027-05-01', endDate: '2027-05-03' },
    'POST',
    aliceCookie,
    { Origin: 'https://evil.example' },
  );
  assert.equal(crossOrigin.status, 403);
});

test('checkout validates time bounds, branch, terms, extras and price before writing', async () => {
  const valid = await checkoutInput(
    'veh_003',
    '2027-03-01T10:00',
    '2027-03-01T11:00',
  );
  for (const [status, changes] of [
    [400, { pickupAt: '2020-01-01T10:00', dropoffAt: '2020-01-02T10:00' }],
    [400, { dropoffAt: '2027-03-01T10:59' }],
    [400, { dropoffAt: '2028-03-01T10:00' }],
    [400, { pickupAt: '2027-02-30T10:00' }],
    [400, { pickupLocationId: 'unknown' }],
    [400, { dropoffLocationId: 'another-branch' }],
    [400, { addOnIds: ['unknown'] }],
    [400, { protectionPlanId: 'unknown' }],
    [400, { acceptedTermsVersion: '' }],
    [409, { acceptedTermsVersion: 'old-terms' }],
  ])
    await request(
      '/bookings',
      status,
      { ...valid, extras: { ...valid.extras, ...changes } },
      'POST',
      aliceCookie,
    );
  await request(
    '/bookings',
    409,
    { ...valid, expectedTotalCents: 1 },
    'POST',
    aliceCookie,
  );
  assert.equal(
    await app
      .get(PrismaService)
      .booking.count({ where: { vehicleId: 'veh_003' } }),
    0,
  );
  const booking = (await request('/bookings', 201, valid, 'POST', aliceCookie))
    .booking;
  assert.equal(
    booking.startDate,
    booking.endDate,
    'one-hour same-day rental works',
  );
  assert.equal(booking.quote.days, 1);
  await app.get(PrismaService).vehicle.update({
    where: { id: valid.vehicleId },
    data: { pricePerDay: 999, salePricePerDay: null },
  });
  assert.deepEqual(
    await request(
      `/bookings/${booking.id}`,
      200,
      undefined,
      'GET',
      aliceCookie,
    ),
    booking,
  );
  assert.deepEqual(
    (await request('/bookings', 201, valid, 'POST', aliceCookie)).booking,
    booking,
    'replay returns original price',
  );
});

test('availability enforces the full turnaround on both sides, including legacy and cancelled bookings', async () => {
  const hasCar = async (id, pickupAt, dropoffAt) =>
    (
      await request(`/vehicles?${new URLSearchParams({ pickupAt, dropoffAt })}`)
    ).some((v) => v.id === id);
  assert.equal(
    await hasCar('veh_001', '2027-02-04T09:59', '2027-02-05T10:00'),
    false,
  );
  assert.equal(
    await hasCar('veh_001', '2027-02-04T10:00', '2027-02-05T10:00'),
    true,
  );
  assert.equal(
    await hasCar('veh_001', '2027-01-30T10:00', '2027-01-31T10:01'),
    false,
  );
  assert.equal(
    await hasCar('veh_001', '2027-01-30T10:00', '2027-01-31T10:00'),
    true,
  );
  for (const [start, end, status] of [
    ['2027-02-04T09:59', '2027-02-05T10:00', 409],
    ['2027-01-30T10:00', '2027-01-31T10:01', 409],
    ['2027-01-30T10:00', '2027-01-31T10:00', 201],
    ['2027-02-04T10:00', '2027-02-05T10:00', 201],
  ])
    await request(
      '/bookings',
      status,
      await checkoutInput('veh_001', start, end),
      'POST',
      aliceCookie,
    );
  assert.equal(
    await hasCar('veh_002', '2027-05-03T23:59', '2027-05-05T00:00'),
    false,
    'legacy return buffer',
  );
  assert.equal(
    await hasCar('veh_002', '2027-05-04T00:00', '2027-05-05T00:00'),
    true,
  );
  await app.get(PrismaService).booking.update({
    where: { id: 'legacy-unowned' },
    data: { status: 'cancelled' },
  });
  assert.equal(
    await hasCar('veh_002', '2027-05-01T00:00', '2027-05-03T00:00'),
    true,
  );
  await request('/vehicles?pickupAt=2027-05-01T10:00', 400);
  await request(
    '/vehicles?pickupAt=2027-05-01T10:00&dropoffAt=2027-05-01T09:00',
    400,
  );
});

test('concurrent users cannot double-book and concurrent retries create one record', async () => {
  const input = await checkoutInput(
    'veh_004',
    '2027-06-01T10:00',
    '2027-06-02T10:00',
  );
  const responses = await Promise.all(
    [aliceCookie, bobCookie].map((cookie) =>
      rawRequest(
        '/bookings',
        { ...input, requestKey: randomUUID() },
        'POST',
        cookie,
      ),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    await app
      .get(PrismaService)
      .booking.count({ where: { vehicleId: 'veh_004' } }),
    1,
  );
  const retry = await checkoutInput(
    'veh_006',
    '2027-06-01T10:00',
    '2027-06-02T10:00',
  );
  const replay = await Promise.all(
    Array.from({ length: 5 }, () =>
      request('/bookings', 201, retry, 'POST', aliceCookie),
    ),
  );
  assert.equal(new Set(replay.map((r) => r.booking.id)).size, 1);
  assert.equal(
    await app
      .get(PrismaService)
      .booking.count({ where: { vehicleId: 'veh_006' } }),
    1,
  );
  const otherUser = {
    ...retry,
    extras: {
      ...retry.extras,
      pickupAt: '2027-06-05T10:00',
      dropoffAt: '2027-06-06T10:00',
    },
  };
  const other = await request('/bookings', 201, otherUser, 'POST', bobCookie);
  assert.notEqual(
    other.booking.id,
    replay[0].booking.id,
    'request keys are scoped to each owner',
  );
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

test('history paginates all owned records with stable ties and rejects foreign cursors', async () => {
  const prisma = app.get(PrismaService);
  const before = await prisma.booking.count({ where: { userId: alice.id } });
  const bob = await prisma.user.findUnique({
    where: { email: 'bob@example.com' },
  });
  const fixture = {
    vehicleId: 'veh_010',
    customerName: alice.name,
    customerEmail: alice.email,
    startDate: new Date('2020-01-01'),
    endDate: new Date('2020-01-03'),
    createdAt: new Date('2030-01-01'),
  };
  await prisma.booking.createMany({
    data: [
      ...Array.from({ length: 23 }, (_, i) => ({
        ...fixture,
        id: `history_${String(i).padStart(2, '0')}`,
        userId: alice.id,
        status: i % 2 ? 'confirmed' : 'cancelled',
      })),
      { ...fixture, id: 'history_foreign', userId: bob.id },
      { ...fixture, id: 'history_unowned' },
    ],
  });
  const response = await rawRequest('/bookings', undefined, 'GET', aliceCookie);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  let page = contracts.BookingHistorySchema.parse(await response.json());
  assert.equal(page.items.length, 10);
  assert.equal(page.items[0].id, 'history_22');
  assert.ok(page.nextCursor);
  await prisma.booking.create({
    data: {
      ...fixture,
      id: 'history_new',
      userId: alice.id,
      createdAt: new Date('2031-01-01'),
    },
  });
  const ids = page.items.map((b) => b.id);
  while (page.nextCursor) {
    page = contracts.BookingHistorySchema.parse(
      await request(
        `/bookings?cursor=${page.nextCursor}`,
        200,
        undefined,
        'GET',
        aliceCookie,
      ),
    );
    ids.push(...page.items.map((b) => b.id));
  }
  assert.equal(ids.length, before + 23);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(
    !ids.includes('history_foreign') &&
      !ids.includes('history_unowned') &&
      !ids.includes('history_new'),
  );
  for (const cursor of ['history_foreign', 'history_unowned', 'missing', ''])
    await request(
      `/bookings?cursor=${cursor}`,
      400,
      undefined,
      'GET',
      aliceCookie,
    );
  await request(
    '/bookings?cursor=history_01&cursor=history_02',
    400,
    undefined,
    'GET',
    aliceCookie,
  );
  const legacy = await request(
    '/bookings/history_01',
    200,
    undefined,
    'GET',
    aliceCookie,
  );
  assert.equal(legacy.totalCents, undefined);
  assert.equal(
    legacy.extras,
    undefined,
    'legacy details do not invent receipt data',
  );
  await request(
    '/bookings/history_foreign',
    404,
    undefined,
    'GET',
    aliceCookie,
  );
});

test('confirmation jobs are atomic, unique per booking, private and absent for legacy records', async () => {
  const prisma = app.get(PrismaService);
  const job = await prisma.confirmationEmail.findUnique({
    where: { bookingId: savedBooking.id },
  });
  assert.equal(job.recipient, alice.email);
  assert.equal(job.attempts, 0);
  assert.ok(job.text.includes(savedBooking.totalLabel));
  assert.ok(
    job.text.includes(`http://localhost:3000/bookings/${savedBooking.id}`),
  );
  assert.deepEqual(
    await request(
      `/bookings/${savedBooking.id}/email`,
      200,
      undefined,
      'GET',
      aliceCookie,
    ),
    { status: 'queued', sentAt: null },
  );
  await request(`/bookings/${savedBooking.id}/email`, 401);
  await request(
    `/bookings/${savedBooking.id}/email`,
    404,
    undefined,
    'GET',
    bobCookie,
  );
  await request(
    '/bookings/legacy-unowned/email',
    404,
    undefined,
    'GET',
    aliceCookie,
  );
  assert.deepEqual(
    await request(
      '/bookings/history_01/email',
      200,
      undefined,
      'GET',
      aliceCookie,
    ),
    { status: 'not_requested', sentAt: null },
  );
  assert.equal(
    await prisma.confirmationEmail.count(),
    await prisma.booking.count({
      where: {
        checkoutSnapshot: {
          not: require('../dist/generated/prisma/client.js').Prisma.DbNull,
        },
      },
    }),
  );
  const input = await checkoutInput(
    'veh_009',
    '2027-11-01T10:00',
    '2027-11-02T10:00',
  );
  // Reject only future queue inserts, proving an outbox write failure rolls
  // back the booking too. Existing fixtures are deliberately not validated.
  await prisma.$executeRawUnsafe(
    `ALTER TABLE confirmation_emails ADD CONSTRAINT reject_test_recipient CHECK (recipient <> 'alice@example.com') NOT VALID`,
  );
  try {
    await request('/bookings', 500, input, 'POST', aliceCookie);
    assert.equal(
      await prisma.booking.count({ where: { requestKey: input.requestKey } }),
      0,
    );
  } finally {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE confirmation_emails DROP CONSTRAINT reject_test_recipient',
    );
  }
  const first = await request('/bookings', 201, input, 'POST', aliceCookie);
  await request('/bookings', 201, input, 'POST', aliceCookie);
  assert.equal(
    await prisma.confirmationEmail.count({
      where: { bookingId: first.booking.id },
    }),
    1,
  );
});

test('SMTP outage leaves bookings successful and pending mail survives restart with backoff', async () => {
  await app.close();
  process.env.SMTP_PORT = '1'; // A closed local port; never contact an external provider.
  await startApi();
  const input = await checkoutInput(
    'veh_008',
    '2027-12-01T10:00',
    '2027-12-02T10:00',
  );
  const { booking } = await request(
    '/bookings',
    201,
    input,
    'POST',
    aliceCookie,
  );
  await app.get(EmailService).processDue();
  const job = await app
    .get(PrismaService)
    .confirmationEmail.findUnique({ where: { bookingId: booking.id } });
  assert.equal(job.attempts, 1);
  assert.ok(job.nextAttemptAt > new Date());
  assert.equal(job.lockedUntil, null);
  assert.equal(job.lastError, 'Delivery attempt failed');
  assert.equal(
    (
      await request(
        `/bookings/${booking.id}/email`,
        200,
        undefined,
        'GET',
        aliceCookie,
      )
    ).status,
    'retrying',
  );
  assert.equal(
    (
      await request(
        `/bookings/${booking.id}`,
        200,
        undefined,
        'GET',
        aliceCookie,
      )
    ).status,
    'confirmed',
  );
  await app.get(EmailService).processDue();
  assert.equal(
    (
      await app
        .get(PrismaService)
        .confirmationEmail.findUnique({ where: { bookingId: booking.id } })
    ).attempts,
    1,
    'backoff prevents immediate retry',
  );
  await app.close();
  process.env.SMTP_PORT = smtpPort;
  await startApi();
  assert.equal(
    (
      await app
        .get(PrismaService)
        .confirmationEmail.findUnique({ where: { bookingId: booking.id } })
    ).attempts,
    1,
  );
});

test('real SMTP delivery uses saved receipts, concurrent workers claim once, and expired leases recover', async () => {
  const prisma = app.get(PrismaService);
  await prisma.confirmationEmail.updateMany({
    data: { nextAttemptAt: new Date(0) },
  });
  // A second Nest instance represents another API process sharing the queue.
  const second = await NestFactory.create(AppModule, { logger: false });
  await second.init();
  try {
    await Promise.all([
      app.get(EmailService).processDue(),
      second.get(EmailService).processDue(),
    ]);
  } finally {
    await second.close();
  }
  const jobs = await prisma.confirmationEmail.findMany();
  assert.ok(jobs.every((job) => job.sentAt && !job.lockedUntil));
  assert.ok(
    jobs.every((job) => job.attempts === 2),
    'each job has one failed attempt and one claimed successful attempt',
  );
  const listing = await (await fetch(`${mailUrl}/api/v1/messages`)).json();
  assert.equal(listing.total, jobs.length);
  const summary = listing.messages.find((message) =>
    message.Subject.includes(savedBooking.id),
  );
  assert.ok(summary);
  const message = await (
    await fetch(`${mailUrl}/api/v1/message/${summary.ID}`)
  ).json();
  assert.equal(message.To[0].Address, alice.email);
  assert.ok(message.Text.includes(savedBooking.totalLabel));
  assert.ok(message.Text.includes('GPS navigation'));
  assert.ok(message.HTML.includes(`/bookings/${savedBooking.id}`));
  const status = await rawRequest(
    `/bookings/${savedBooking.id}/email`,
    undefined,
    'GET',
    aliceCookie,
  );
  assert.equal(status.headers.get('cache-control'), 'no-store');
  assert.equal((await status.json()).status, 'sent');
  await app.get(EmailService).processDue();
  assert.equal(
    (await (await fetch(`${mailUrl}/api/v1/messages`)).json()).total,
    jobs.length,
  );
  // Model a crash after SMTP accepted a message but before recording success.
  // An unexpired claim must not be stolen; an expired one must be retried.
  await prisma.confirmationEmail.update({
    where: { bookingId: savedBooking.id },
    data: {
      sentAt: null,
      lockedUntil: new Date(Date.now() + 60000),
      lockToken: 'abandoned',
    },
  });
  await app.get(EmailService).processDue();
  assert.equal(
    (
      await prisma.confirmationEmail.findUnique({
        where: { bookingId: savedBooking.id },
      })
    ).sentAt,
    null,
  );
  await prisma.confirmationEmail.update({
    where: { bookingId: savedBooking.id },
    data: { lockedUntil: new Date(0) },
  });
  await app.get(EmailService).processDue();
  assert.ok(
    (
      await prisma.confirmationEmail.findUnique({
        where: { bookingId: savedBooking.id },
      })
    ).sentAt,
  );
  assert.equal(
    (await (await fetch(`${mailUrl}/api/v1/messages`)).json()).total,
    jobs.length,
    'local inbox deduplicates stable Message-ID',
  );
  run('docker', ['stop', mailContainerId]);
  run('docker', ['start', mailContainerId]);
  const restarted = JSON.parse(run('docker', ['inspect', mailContainerId]))[0];
  smtpPort = restarted.NetworkSettings.Ports['1025/tcp'][0].HostPort;
  process.env.SMTP_PORT = smtpPort;
  mailUrl = `http://127.0.0.1:${restarted.NetworkSettings.Ports['8025/tcp'][0].HostPort}`;
  let total;
  for (let i = 0; i < 30; i++) {
    try {
      total = (
        await (
          await fetch(`${mailUrl}/api/v1/messages`, {
            signal: AbortSignal.timeout(1000),
          })
        ).json()
      ).total;
      break;
    } catch {
      await delay(100);
    }
  }
  assert.equal(
    total,
    jobs.length,
    'captured messages survive inbox stop/start',
  );
});

test('background worker sends new confirmations automatically without an HTTP trigger', async () => {
  await app.close();
  process.env.EMAIL_WORKER_ENABLED = 'true';
  await startApi();
  const input = await checkoutInput(
    'veh_007',
    '2027-12-10T10:00',
    '2027-12-11T10:00',
  );
  const { booking } = await request(
    '/bookings',
    201,
    input,
    'POST',
    aliceCookie,
  );
  let sent = false;
  for (let i = 0; i < 70; i++) {
    const job = await app
      .get(PrismaService)
      .confirmationEmail.findUnique({ where: { bookingId: booking.id } });
    if (job.sentAt) {
      sent = true;
      break;
    }
    await delay(100);
  }
  assert.ok(sent, 'background poll sends within the configured interval');
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
