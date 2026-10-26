import assert from 'node:assert/strict';

// Run against a started local stack. These checks never create customer data.
const bff = process.env.BFF_URL ?? 'http://localhost:3001';
const web = process.env.WEB_URL ?? 'http://localhost:3000';
let passed = 0;

async function check(base, path, expected = 200, options) {
  const response = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(30_000),
    ...options,
  });
  assert.equal(response.status, expected, `${path}: expected ${expected}, received ${response.status}`);
  passed++;
  console.log(`PASS ${response.status} ${path}`);
  return response;
}

await check(bff, '/health');
const vehicles = await (await check(bff, '/vehicles')).json();
assert.ok(vehicles.length > 0, 'Seed the database before running smoke tests');
const vehicle = vehicles[0];
for (const path of ['/locations', '/catalog', '/terms', '/geocode?q=Boston']) {
  await check(bff, path);
}
const filtered = await (await check(bff, '/vehicles?classes=suv')).json();
assert.ok(filtered.every(v => v.class === 'suv'));
await check(bff, '/vehicles?minPricePerDay=abc', 400);
await check(bff, '/vehicles?pickupAt=2027-01-01T10:00&dropoffAt=2027-01-03T10:00');
await check(bff, '/vehicles?pickupAt=2027-01-01T10:00', 400);
await check(bff, '/geocode?q=Boston&q=LA', 400);
await check(bff, '/vehicles/nonexistent', 404);
await check(bff, '/bookings', 401);
await check(bff, '/bookings/nonexistent', 401);
assert.deepEqual(await (await check(bff, '/auth/session')).json(), { user: null });
for (const path of ['/reservations', '/rentals/current', '/customers/me', '/journeys/pre-check-in/nonexistent']) {
  await check(bff, path, 404);
}
const query = new URLSearchParams({vehicleId: vehicle.id, pickupAt: '2027-01-01T10:00', dropoffAt: '2027-01-03T10:00'});
const quote = await (await check(bff, `/quote?${query}`)).json();
assert.equal(quote.days, 2);
assert.equal(quote.totalCents, quote.subtotalCents + quote.taxCents);
query.set('dropoffAt', '2027-01-01T09:00');
await check(bff, `/quote?${query}`, 400);
query.set('dropoffAt', '2027-01-03T10:00');
query.set('addOnIds', 'nonexistent');
await check(bff, `/quote?${query}`, 400);
await check(bff, '/bookings', 401, {
  method: 'POST', headers: {'content-type': 'application/json'}, body: '{}',
});
for (const path of ['/', '/vehicles', `/vehicles/${vehicle.id}`, '/sign-in', '/sign-up']) {
  const html = await (await check(web, path)).text();
  assert.ok(!html.includes('Couldn&#x27;t load vehicles'), `${path}: vehicle loading failed`);
}
await check(web, '/vehicles/nonexistent', 404);
assert.deepEqual(await (await check(web, '/api/auth/session')).json(), { user: null });
await check(web, '/api/vehicles');
const accountRedirect = await check(web, '/account', 307, { redirect: 'manual' });
assert.equal(new URL(accountRedirect.headers.get('location'), web).pathname, '/sign-in');
const confirmationRedirect = await check(web, '/bookings/nonexistent/confirmation', 307, { redirect: 'manual' });
const loginUrl = new URL(confirmationRedirect.headers.get('location'), web);
assert.equal(loginUrl.pathname, '/sign-in');
assert.equal(loginUrl.searchParams.get('next'), '/bookings/nonexistent/confirmation');
console.log(`${passed} smoke checks passed. Use a browser to verify client interactions.`);
