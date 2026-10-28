import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
const require = createRequire(import.meta.url);
const cwd = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/app.module.js");
const { PrismaService } = require("../dist/prisma/prisma.service.js");
const { PrismaClient } = require("../dist/generated/prisma/client.js");
const { PrismaPg } = require("@prisma/adapter-pg");
const { importLegacyIdentity } = require("../dist/legacy-import.js");
const { hashPassword } = require("../dist/auth/password.js");
const { tokenHash } = require("../dist/auth/session-cookie.js");
const { seedDemoAccount } = require("../dist/auth/demo-account.js");
let container, source, target, app, base, sourceUrl, passwordHash;
const token = "a".repeat(64),
  expired = "b".repeat(64),
  key = "identity-integration-key";
const legacyId = "legacy-demo-owner";
function run(command, args) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 60000,
    stdio: "pipe",
  }).trim();
}
async function request(path, body = {}, serviceKey = key) {
  return fetch(`${base}/internal/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Key": serviceKey,
    },
    body: JSON.stringify(body),
  });
}
async function start() {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, "127.0.0.1");
  base = await app.getUrl();
}
before(
  async () => {
    process.env.NODE_ENV = "test";
    process.env.IDENTITY_SERVICE_KEY = key;
    container = run("docker", [
      "run",
      "-d",
      "--name",
      `identity-test-${randomUUID()}`,
      "-e",
      "POSTGRES_USER=identity",
      "-e",
      "POSTGRES_PASSWORD=test",
      "-e",
      "POSTGRES_DB=identity",
      "-p",
      "127.0.0.1::5432",
      "postgres:17",
    ]);
    const port = JSON.parse(run("docker", ["inspect", container]))[0]
      .NetworkSettings.Ports["5432/tcp"][0].HostPort;
    process.env.IDENTITY_DATABASE_URL = `postgresql://identity:test@127.0.0.1:${port}/identity`;
    // A wrong Rental URL cannot affect normal Identity operations.
    process.env.DATABASE_URL =
      "postgresql://forbidden:forbidden@127.0.0.1:1/rental";
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        run("docker", ["exec", container, "pg_isready", "-U", "identity"]);
        ready = true;
        break;
      } catch {
        await delay(250);
      }
    }
    assert.ok(ready);
    run(process.execPath, [
      resolve(
        dirname(require.resolve("prisma/package.json")),
        "build/index.js",
      ),
      "migrate",
      "deploy",
    ]);
    run("docker", [
      "exec",
      container,
      "psql",
      "-U",
      "identity",
      "-d",
      "identity",
      "-c",
      "CREATE DATABASE legacy",
    ]);
    sourceUrl = `postgresql://identity:test@127.0.0.1:${port}/legacy`;
    source = new PrismaClient({
      adapter: new PrismaPg({ connectionString: sourceUrl }),
    });
    target = new PrismaService();
    await source.$executeRawUnsafe(
      'CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)',
    );
    await source.$executeRawUnsafe(
      'CREATE TABLE sessions ("tokenHash" TEXT PRIMARY KEY, "userId" TEXT REFERENCES users(id), "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)',
    );
    await source.$executeRawUnsafe(
      'CREATE TABLE bookings (id TEXT PRIMARY KEY, "userId" TEXT REFERENCES users(id))',
    );
    passwordHash = await hashPassword("PreservedPassword123!");
    await source.user.create({
      data: {
        id: legacyId,
        email: "demo@handoff.local",
        name: "Existing Driver",
        passwordHash,
      },
    });
    await source.session.createMany({
      data: [
        {
          tokenHash: tokenHash(token),
          userId: legacyId,
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          tokenHash: tokenHash(expired),
          userId: legacyId,
          expiresAt: new Date(0),
        },
      ],
    });
    await source.$executeRaw`INSERT INTO bookings (id, "userId") VALUES ('existing-booking', ${legacyId})`;
  },
  { timeout: 120000 },
);
after(async () => {
  try {
    await app?.close();
    await source?.$disconnect();
    await target?.$disconnect();
  } finally {
    if (container) run("docker", ["rm", "-f", "-v", container]);
  }
});

test("migration refuses a populated destination without partially importing or overwriting credentials", async () => {
  await target.user.create({
    data: {
      id: "conflict",
      email: "demo@handoff.local",
      name: "Other",
      passwordHash: "do-not-overwrite",
    },
  });
  await assert.rejects(importLegacyIdentity(target, sourceUrl), /refusing/);
  assert.equal(await target.user.count(), 1);
  assert.equal(await target.session.count(), 0);
  assert.equal(await target.identityImport.count(), 0);
  assert.equal(
    (await target.user.findUnique({ where: { id: "conflict" } })).passwordHash,
    "do-not-overwrite",
  );
  await target.user.deleteMany();
});

test("one-time import preserves identity IDs, password hashes, session hashes and existing booking ownership", async () => {
  await Promise.all([
    importLegacyIdentity(target, sourceUrl),
    importLegacyIdentity(target, sourceUrl),
  ]);
  assert.equal(await target.identityImport.count(), 1);
  const account = await target.user.findUnique({ where: { id: legacyId } });
  assert.equal(account.passwordHash, passwordHash);
  assert.equal(account.name, "Existing Driver");
  assert.equal(await target.session.count(), 2);
  assert.deepEqual(await source.$queryRaw`SELECT id, "userId" FROM bookings`, [
    { id: "existing-booking", userId: legacyId },
  ]);
  await seedDemoAccount(target);
  assert.equal(
    (await target.user.findUnique({ where: { id: legacyId } })).passwordHash,
    passwordHash,
  );
  assert.equal(await target.user.count(), 1);
  await start();
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal(
    (await (await request("session", { token })).json()).user.id,
    legacyId,
  );
  assert.equal(
    (await (await request("session", { token: expired })).json()).user,
    null,
  );
  const login = await request("login", {
    input: { email: "demo@handoff.local", password: "PreservedPassword123!" },
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.id, legacyId);
});

test("internal auth endpoints require service credentials and validate raw session tokens", async () => {
  assert.equal((await request("session", { token }, "wrong")).status, 401);
  assert.equal(
    (
      await request(
        "register",
        {
          input: {
            name: "X",
            email: "x@example.com",
            password: "Password123!",
          },
        },
        "",
      )
    ).status,
    401,
  );
  assert.equal(
    (await request("session", { token: "not-a-token" })).status,
    400,
  );
  assert.equal(
    (
      await request("login", {
        input: { email: "demo@handoff.local", password: "WrongPassword!" },
      })
    ).status,
    401,
  );
  assert.equal(await target.user.count(), 1);
});

test("logout and restart revoke imported sessions permanently; migration replay cannot resurrect them", async () => {
  assert.equal((await request("logout", { token })).status, 204);
  // The stale copy deliberately remains in the legacy DB, as on a real upgrade.
  assert.ok(
    await source.session.findUnique({ where: { tokenHash: tokenHash(token) } }),
  );
  await importLegacyIdentity(target, sourceUrl);
  await app.close();
  await start();
  assert.equal((await (await request("session", { token })).json()).user, null);
  assert.equal(
    (await target.user.findUnique({ where: { id: legacyId } })).passwordHash,
    passwordHash,
  );
});

test("new accounts and session rotation persist independently of the rental database", async () => {
  const result = await request("register", {
    input: {
      name: "New Driver",
      email: "new@example.com",
      password: "Password123!",
    },
  });
  assert.equal(result.status, 201);
  const first = await result.json();
  const login = await request("login", {
    input: { email: "new@example.com", password: "Password123!" },
    token: first.token,
  });
  const second = await login.json();
  assert.notEqual(first.token, second.token);
  assert.equal(
    (await (await request("session", { token: first.token })).json()).user,
    null,
  );
  await app.close();
  await start();
  assert.equal(
    (await (await request("session", { token: second.token })).json()).user.id,
    first.user.id,
  );
  assert.equal(await source.user.count(), 1);
  assert.ok(
    await target.session.findUnique({
      where: { tokenHash: tokenHash(second.token) },
    }),
  );
});
