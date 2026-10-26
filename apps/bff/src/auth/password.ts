import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const COST = 32768;

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt$${COST}$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  encoded?: string,
): Promise<boolean> {
  const match = /^scrypt\$32768\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(
    encoded ?? '',
  );
  // Unknown accounts still incur the password-derivation work.
  const actual = await derive(password, match?.[1] ?? '0'.repeat(32));
  const expected = match ? Buffer.from(match[2], 'hex') : Buffer.alloc(64);
  return timingSafeEqual(actual, expected) && match !== null;
}
