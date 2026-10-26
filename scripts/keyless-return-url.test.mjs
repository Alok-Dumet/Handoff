import assert from 'node:assert/strict';
import test from 'node:test';
import { keylessReturnUrl } from '../apps/web/src/lib/keyless-return-url.ts';

test('keyless sync retains every rental selection and encoded query value', () => {
  const target = 'http://localhost:3000/vehicles/veh_001?pickupAt=2027-01-01T10%3A00&dropoffAt=2027-01-03T10%3A00&note=a%26b';
  assert.equal(keylessReturnUrl(`http://localhost:3000/clerk-sync-keyless?returnUrl=${target}`).href, target);
  assert.equal(keylessReturnUrl(`http://localhost:3000/clerk-sync-keyless?returnUrl=${encodeURIComponent(target)}`).href, target);
  const normalized = new URL(`http://localhost:3000/clerk-sync-keyless?returnUrl=${target}`);
  normalized.search = normalized.searchParams.toString();
  assert.deepEqual([...keylessReturnUrl(normalized.href).searchParams], [...new URL(target).searchParams]);
});

test('keyless sync rejects external destinations, loops, and malformed URLs', () => {
  for (const target of ['https://example.com', '//example.com', '/clerk-sync-keyless', 'http://[', 'javascript:alert(1)', '']) {
    assert.equal(keylessReturnUrl(`http://localhost:3000/clerk-sync-keyless?returnUrl=${encodeURIComponent(target)}`).href, 'http://localhost:3000/');
  }
});
