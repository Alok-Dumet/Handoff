import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../apps/identity/src/auth/password.ts';
import { sessionToken, sessionCookieOptions, tokenHash, SESSION_DURATION_MS } from '../apps/bff/src/auth/session-cookie.ts';

test('passwords use distinct salts and reject wrong or missing credentials', async () => {
  const first = await hashPassword('a correct horse battery staple');
  const second = await hashPassword('a correct horse battery staple');
  assert.notEqual(first, second);
  assert.ok(!first.includes('correct horse'));
  assert.equal(await verifyPassword('a correct horse battery staple', first), true);
  assert.equal(await verifyPassword('wrong password', first), false);
  assert.equal(await verifyPassword('anything', undefined), false);
  assert.equal(await verifyPassword('anything', 'malformed'), false);
});

test('session cookies reject malformed or ambiguous tokens', () => {
  const token = 'a'.repeat(64);
  assert.equal(sessionToken(`other=value; handoff_session=${token}`), token);
  for (const input of [undefined, '', 'handoff_session=short', `handoff_session=${token}; handoff_session=${token}`, `handoff_session=${token}%20`]) {
    assert.equal(sessionToken(input), undefined);
  }
  assert.match(tokenHash(token), /^[a-f0-9]{64}$/);
  assert.notEqual(tokenHash(token), token);
});

test('session cookie flags support local HTTP and deployed HTTPS', () => {
  const options = sessionCookieOptions('http://localhost:3000');
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
  assert.equal(options.maxAge, SESSION_DURATION_MS);
  assert.equal(options.secure, false);
  assert.equal(sessionCookieOptions('https://demo.example.com').secure, true);
});
