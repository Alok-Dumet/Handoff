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
const { NotificationsService } = require("../dist/notifications.service.js");
let db, mail, app, base, inbox, smtpPort;
const key = "isolated-service-test-key";
const payload = {
  bookingId: "booking_test",
  recipient: "driver@example.com",
  subject: "Your reservation",
  text: "Saved total: $123.00",
  html: "<p>Saved total: $123.00</p>",
  messageId: "<booking_test.confirmation@handoff.local>",
  createdAt: "2026-10-27T10:00:00.000Z",
};
function run(command, args) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 60000,
    stdio: "pipe",
  }).trim();
}
async function start() {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, "127.0.0.1");
  base = await app.getUrl();
}
async function send(body = payload, token = key) {
  return fetch(`${base}/internal/confirmations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Service-Key": token },
    body: JSON.stringify(body),
  });
}
async function status(id = payload.bookingId, token = key) {
  return fetch(`${base}/internal/confirmations/${id}`, {
    headers: { "X-Service-Key": token },
  });
}
before(
  async () => {
    process.env.NODE_ENV = "test";
    process.env.NOTIFICATIONS_SERVICE_KEY = key;
    process.env.EMAIL_WORKER_ENABLED = "false";
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_REQUIRE_TLS = "false";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    db = run("docker", [
      "run",
      "-d",
      "--name",
      `notifications-test-${randomUUID()}`,
      "-e",
      "POSTGRES_USER=notifications",
      "-e",
      "POSTGRES_PASSWORD=test",
      "-e",
      "POSTGRES_DB=notifications",
      "-p",
      "127.0.0.1::5432",
      "postgres:17",
    ]);
    const port = JSON.parse(run("docker", ["inspect", db]))[0].NetworkSettings
      .Ports["5432/tcp"][0].HostPort;
    process.env.NOTIFICATIONS_DATABASE_URL = `postgresql://notifications:test@127.0.0.1:${port}/notifications`;
    // Prove the service does not consume the rental DATABASE_URL.
    process.env.DATABASE_URL =
      "postgresql://forbidden:forbidden@127.0.0.1:1/rental";
    mail = run("docker", [
      "run",
      "-d",
      "--name",
      `notifications-mail-${randomUUID()}`,
      "-p",
      "127.0.0.1::1025",
      "-p",
      "127.0.0.1::8025",
      "-e",
      "MP_IGNORE_DUPLICATE_IDS=true",
      "-e",
      "MP_DISABLE_VERSION_CHECK=true",
      "axllent/mailpit:v1.27.4",
    ]);
    const ports = JSON.parse(run("docker", ["inspect", mail]))[0]
      .NetworkSettings.Ports;
    smtpPort = ports["1025/tcp"][0].HostPort;
    inbox = `http://127.0.0.1:${ports["8025/tcp"][0].HostPort}`;
    process.env.SMTP_PORT = "1";
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        run("docker", ["exec", db, "pg_isready", "-U", "notifications"]);
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
    await start();
  },
  { timeout: 120000 },
);
after(async () => {
  try {
    await app?.close();
  } finally {
    if (db) run("docker", ["rm", "-f", "-v", db]);
    if (mail) run("docker", ["rm", "-f", "-v", mail]);
  }
});

test("health uses its own database; internal routes authenticate and validate", async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await send(payload, "")).status, 401);
  assert.equal((await status(payload.bookingId, "wrong")).status, 401);
  assert.equal((await send({ ...payload, recipient: "invalid" })).status, 400);
  assert.equal(
    (await send({ ...payload, subject: "injected\r\nheader" })).status,
    400,
  );
  assert.equal((await status("missing")).status, 404);
  assert.equal(await app.get(PrismaService).confirmationEmail.count(), 0);
});

test("concurrent event delivery is idempotent and conflicting payloads cannot overwrite the receipt", async () => {
  const results = await Promise.all(Array.from({ length: 5 }, () => send()));
  assert.ok(results.every((r) => r.status === 201));
  assert.equal(await app.get(PrismaService).confirmationEmail.count(), 1);
  assert.equal((await send({ ...payload, text: "changed" })).status, 409);
  const job = await app
    .get(PrismaService)
    .confirmationEmail.findUnique({ where: { bookingId: payload.bookingId } });
  assert.equal(job.text, payload.text);
  assert.equal(job.attempts, 0);
});

test("SMTP outages persist retry state and restart does not lose accepted jobs", async () => {
  await app.get(NotificationsService).processDue();
  const prisma = app.get(PrismaService);
  const job = await prisma.confirmationEmail.findUnique({
    where: { bookingId: payload.bookingId },
  });
  assert.equal(job.attempts, 1);
  assert.ok(job.nextAttemptAt > new Date());
  assert.equal(job.lockedUntil, null);
  assert.equal((await (await status()).json()).status, "retrying");
  await app.get(NotificationsService).processDue();
  assert.equal(
    (
      await prisma.confirmationEmail.findUnique({
        where: { bookingId: payload.bookingId },
      })
    ).attempts,
    1,
  );
  await app.close();
  process.env.SMTP_PORT = smtpPort;
  await start();
  assert.equal((await (await status()).json()).status, "retrying");
});

test("two workers claim once, send real SMTP, and recover an expired lease without duplicate inbox messages", async () => {
  const prisma = app.get(PrismaService);
  await prisma.confirmationEmail.updateMany({
    data: { nextAttemptAt: new Date(0) },
  });
  const second = await NestFactory.create(AppModule, { logger: false });
  await second.init();
  try {
    await Promise.all([
      app.get(NotificationsService).processDue(),
      second.get(NotificationsService).processDue(),
    ]);
  } finally {
    await second.close();
  }
  let job = await prisma.confirmationEmail.findUnique({
    where: { bookingId: payload.bookingId },
  });
  assert.equal(job.attempts, 2);
  assert.ok(job.sentAt);
  let listing = await (await fetch(`${inbox}/api/v1/messages`)).json();
  assert.equal(listing.total, 1);
  const message = await (
    await fetch(`${inbox}/api/v1/message/${listing.messages[0].ID}`)
  ).json();
  assert.equal(message.To[0].Address, payload.recipient);
  assert.equal(message.Text, payload.text);
  const deliveryStatus = await status();
  assert.equal(deliveryStatus.headers.get("cache-control"), "no-store");
  assert.equal((await deliveryStatus.json()).status, "sent");
  assert.equal((await (await send()).json()).status, "sent");
  await prisma.confirmationEmail.update({
    where: { bookingId: payload.bookingId },
    data: {
      sentAt: null,
      lockedUntil: new Date(Date.now() + 60000),
      lockToken: "crashed",
      nextAttemptAt: new Date(0),
    },
  });
  await app.get(NotificationsService).processDue();
  assert.equal(
    (
      await prisma.confirmationEmail.findUnique({
        where: { bookingId: payload.bookingId },
      })
    ).sentAt,
    null,
  );
  await prisma.confirmationEmail.update({
    where: { bookingId: payload.bookingId },
    data: { lockedUntil: new Date(0) },
  });
  await app.get(NotificationsService).processDue();
  job = await prisma.confirmationEmail.findUnique({
    where: { bookingId: payload.bookingId },
  });
  assert.ok(job.sentAt);
  listing = await (await fetch(`${inbox}/api/v1/messages`)).json();
  assert.equal(listing.total, 1);
});

test("background delivery runs independently of rental API and survives service restart", async () => {
  await app.close();
  process.env.EMAIL_WORKER_ENABLED = "true";
  await start();
  const second = {
    ...payload,
    bookingId: "booking_background",
    messageId: "<booking_background.confirmation@handoff.local>",
  };
  assert.equal((await send(second)).status, 201);
  let sent = false;
  for (let i = 0; i < 100; i++) {
    if ((await (await status(second.bookingId)).json()).status === "sent") {
      sent = true;
      break;
    }
    await delay(100);
  }
  assert.ok(sent);
  await app.close();
  await start();
  assert.equal((await (await send(second)).json()).status, "sent");
  assert.equal(
    (await (await fetch(`${inbox}/api/v1/messages`)).json()).total,
    2,
  );
});
