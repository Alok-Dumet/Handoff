import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cwd = `${root}/apps/bff`;
const require = createRequire(`${cwd}/package.json`);
const webRequire = createRequire(`${root}/apps/web/package.json`);
const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("./dist/app.module.js");
const origin = "http://127.0.0.1:3400";
let containerId, mailContainerId, app, identity, notifications, browser, next;
const identityCwd = `${root}/apps/identity`;
const identityRequire = createRequire(`${identityCwd}/package.json`);
const { PrismaService: IdentityPrisma } = identityRequire(
  "./dist/prisma/prisma.service.js",
);
const notificationsCwd = `${root}/apps/notifications`;
const notificationsRequire = createRequire(`${notificationsCwd}/package.json`);
let delayHistory = false;
let nextLogs = "";
function run(command, args, workingDir = cwd) {
  return execFileSync(command, args, {
    cwd: workingDir,
    encoding: "utf8",
    timeout: 60000,
    stdio: "pipe",
  }).trim();
}

try {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(3400, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => probe.close(resolve));
  containerId = run("docker", [
    "run",
    "--rm",
    "-d",
    "--name",
    `handoff-history-browser-${randomUUID()}`,
    "-e",
    "POSTGRES_USER=handoff_test",
    "-e",
    "POSTGRES_PASSWORD=handoff_test",
    "-e",
    "POSTGRES_DB=handoff_test",
    "-p",
    "127.0.0.1::5432",
    "postgres:17",
  ]);
  const inspect = JSON.parse(run("docker", ["inspect", containerId]))[0];
  const port = inspect.NetworkSettings.Ports["5432/tcp"][0].HostPort;
  process.env.DATABASE_URL = `postgresql://handoff_test:handoff_test@127.0.0.1:${port}/handoff_test`;
  process.env.WEB_ORIGIN = origin;
  process.env.NODE_ENV = "development";
  process.env.EMAIL_WORKER_ENABLED = "false";
  mailContainerId = run("docker", [
    "run",
    "-d",
    "--name",
    `handoff-mail-browser-${randomUUID()}`,
    "-p",
    "127.0.0.1::1025",
    "-p",
    "127.0.0.1::8025",
    "-e",
    "MP_DISABLE_VERSION_CHECK=true",
    "-e",
    "MP_IGNORE_DUPLICATE_IDS=true",
    "axllent/mailpit:v1.27.4",
  ]);
  const mail = JSON.parse(run("docker", ["inspect", mailContainerId]))[0];
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = mail.NetworkSettings.Ports["1025/tcp"][0].HostPort;
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_REQUIRE_TLS = "false";
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  process.env.DEMO_INBOX_URL = `http://127.0.0.1:${mail.NetworkSettings.Ports["8025/tcp"][0].HostPort}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      run("docker", [
        "exec",
        containerId,
        "pg_isready",
        "-U",
        "handoff_test",
        "-d",
        "handoff_test",
      ]);
      ready = true;
      break;
    } catch {
      await delay(250);
    }
  }
  assert.ok(ready);
  run(process.execPath, [
    resolve(dirname(require.resolve("prisma/package.json")), "build/index.js"),
    "migrate",
    "deploy",
  ]);
  run(process.execPath, [require.resolve("tsx/cli"), "prisma/seed.ts"]);
  run("docker", [
    "exec",
    containerId,
    "psql",
    "-U",
    "handoff_test",
    "-d",
    "handoff_test",
    "-c",
    "CREATE DATABASE notifications_test",
  ]);
  process.env.NOTIFICATIONS_DATABASE_URL = `postgresql://handoff_test:handoff_test@127.0.0.1:${port}/notifications_test`;
  process.env.NOTIFICATIONS_SERVICE_KEY = "history-test-service-key";
  run(
    process.execPath,
    [
      resolve(
        dirname(notificationsRequire.resolve("prisma/package.json")),
        "build/index.js",
      ),
      "migrate",
      "deploy",
    ],
    notificationsCwd,
  );
  notifications = await NestFactory.create(
    notificationsRequire("./dist/app.module.js").AppModule,
    { logger: false },
  );
  await notifications.listen(0, "127.0.0.1");
  process.env.NOTIFICATIONS_URL = await notifications.getUrl();
  run("docker", [
    "exec",
    containerId,
    "psql",
    "-U",
    "handoff_test",
    "-d",
    "handoff_test",
    "-c",
    "CREATE DATABASE identity_test",
  ]);
  process.env.IDENTITY_DATABASE_URL = `postgresql://handoff_test:handoff_test@127.0.0.1:${port}/identity_test`;
  process.env.IDENTITY_SERVICE_KEY = "history-test-identity-key";
  run(
    process.execPath,
    [
      resolve(
        dirname(identityRequire.resolve("prisma/package.json")),
        "build/index.js",
      ),
      "migrate",
      "deploy",
    ],
    identityCwd,
  );
  run(process.execPath, ["dist/seed.js"], identityCwd);
  identity = await NestFactory.create(
    identityRequire("./dist/app.module.js").AppModule,
    { logger: false },
  );
  await identity.listen(0, "127.0.0.1");
  process.env.IDENTITY_URL = await identity.getUrl();
  app = await NestFactory.create(AppModule, { logger: false });
  app.use((req, res, next) => {
    if (delayHistory && req.path === "/bookings") setTimeout(next, 1200);
    else next();
  });
  await app.listen(0, "127.0.0.1");
  const apiUrl = await app.getUrl();
  next = spawn(
    process.execPath,
    [
      webRequire.resolve("next/dist/bin/next"),
      "dev",
      "-p",
      "3400",
      "-H",
      "127.0.0.1",
    ],
    {
      cwd: `${root}/apps/web`,
      env: { ...process.env, BFF_URL: apiUrl },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  next.stdout.on("data", (chunk) => {
    nextLogs = (nextLogs + chunk).slice(-5000);
  });
  next.stderr.on("data", (chunk) => {
    nextLogs = (nextLogs + chunk).slice(-5000);
  });
  let webReady = false;
  for (let i = 0; i < 90; i++) {
    if (next.exitCode !== null) throw new Error(`Next exited: ${nextLogs}`);
    try {
      if ((await fetch(`${origin}/sign-in`)).ok) {
        webReady = true;
        break;
      }
    } catch {}
    await delay(300);
  }
  assert.ok(webReady, nextLogs);
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  });
  const context = await browser.newContext();
  const errors = [],
    external = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
      external.push(url.hostname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(origin + "/bookings");
  await page.waitForURL("**/sign-in?**");
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("History Driver");
  await page.getByLabel("Email address").fill("history@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("HistoryPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.waitForURL(origin + "/bookings");
  await page.getByRole("heading", { name: "No bookings yet" }).waitFor();
  console.log(
    "PASS private history redirect, registration return and empty state",
  );
  const year = new Date().getUTCFullYear() + 1;
  await page.goto(
    origin +
      "/vehicles/veh_001?pickupAt=" +
      year +
      "-07-01T10:00&dropoffAt=" +
      year +
      "-07-03T10:00&addOnIds=gps",
  );
  await page.getByLabel("I have read and agree").click();
  await page.waitForURL("**termsAccepted=**");
  const created = page.waitForResponse(
    (r) => r.url().endsWith("/api/bookings") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Reserve car", exact: true }).click();
  const saved = (await (await created).json()).booking;
  await page.waitForURL("**/confirmation");
  await page
    .getByRole("status")
    .filter({ hasText: "Confirmation email is queued" })
    .waitFor();
  const { EmailService } = require("./dist/email/email.service.js");
  await app.get(EmailService).processDue();
  await notifications
    .get(
      notificationsRequire("./dist/notifications.service.js")
        .NotificationsService,
    )
    .processDue();
  await app
    .get(require("./dist/prisma/prisma.service.js").PrismaService)
    .confirmationEmail.updateMany({ data: { nextAttemptAt: new Date(0) } });
  await app.get(EmailService).processDue();
  await page
    .getByRole("status")
    .filter({ hasText: "Confirmation email sent to history@example.com" })
    .waitFor();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Open local demo inbox" }).click();
  const inbox = await popupPromise;
  await inbox
    .getByText(`Your HandOff reservation ${saved.id}`, { exact: true })
    .waitFor();
  await inbox.close();
  console.log(
    "PASS queued-to-sent confirmation status and real local inbox message",
  );
  await page.getByRole("link", { name: "Bookings", exact: true }).click();
  await page.waitForURL(origin + "/bookings");
  const card = page.locator('a[href="/bookings/' + saved.id + '"]');
  await card.getByText(saved.totalLabel, { exact: true }).waitFor();
  await card.click();
  await page
    .getByRole("heading", { name: "Booking details", exact: true })
    .waitFor();
  await page.getByText("GPS navigation", { exact: true }).waitFor();
  await page.reload();
  await page.getByText(saved.totalLabel, { exact: true }).waitFor();
  console.log("PASS checkout to summary card to persisted detailed receipt");
  const { PrismaService } = require("./dist/prisma/prisma.service.js");
  const prisma = app.get(PrismaService);
  const user = await identity.get(IdentityPrisma).user.findUnique({
    where: { email: "history@example.com" },
  });
  const demo = await identity.get(IdentityPrisma).user.findUnique({
    where: { email: "demo@handoff.local" },
  });
  const stored = await prisma.booking.findUnique({ where: { id: saved.id } });
  const fixture = {
    vehicleId: "veh_010",
    customerName: user.name,
    customerEmail: user.email,
    startDate: new Date("2020-01-01"),
    endDate: new Date("2020-01-03"),
    createdAt: new Date(Date.now() + 100000),
  };
  await prisma.booking.createMany({
    data: [
      ...Array.from({ length: 12 }, (_, i) => ({
        ...fixture,
        id: "history_" + String(i).padStart(2, "0"),
        userId: user.id,
        status: i % 2 ? "confirmed" : "cancelled",
      })),
      { ...fixture, id: "history_foreign", userId: demo.id },
      { ...fixture, id: "history_unowned" },
    ],
  });
  delayHistory = true;
  await page.getByRole("link", { name: "Back to your bookings" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Loading your booking information" })
    .waitFor();
  await page
    .getByRole("heading", { name: "Your bookings", exact: true })
    .waitFor();
  delayHistory = false;
  assert.equal(await page.locator('a[href^="/bookings/history_"]').count(), 10);
  await page.getByRole("link", { name: "Older bookings" }).click();
  await page.waitForURL("**cursor=**");
  await page.locator('a[href="/bookings/' + saved.id + '"]').waitFor();
  await page.getByRole("link", { name: "Latest bookings" }).click();
  await page.locator('a[href="/bookings/history_11"]').click();
  await page.waitForURL("**/bookings/history_11");
  await page
    .getByRole("heading", { name: "Booking details", exact: true })
    .waitFor();
  await page.getByText("Completed", { exact: true }).waitFor();
  await page
    .getByText("This older booking has no saved", { exact: false })
    .waitFor();
  console.log(
    "PASS loading state, pagination, legacy details and completed status",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.goto(origin + "/bookings");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page
    .getByRole("heading", { name: "Your bookings", exact: true })
    .waitFor();
  await page.locator('a[href="/bookings/history_11"]').press("Enter");
  await page.waitForURL("**/bookings/history_11");
  console.log("PASS mobile layout and keyboard-accessible summary cards");
  await page.goto(origin + "/bookings/history_foreign");
  await page.getByRole("heading", { name: "Booking not found" }).waitFor();
  await page.goto(origin + "/bookings/history_unowned");
  await page.getByRole("heading", { name: "Booking not found" }).waitFor();
  await page.goto(origin + "/bookings?cursor=history_foreign");
  await page
    .getByRole("alert")
    .filter({ hasText: "no longer available" })
    .waitFor();
  console.log(
    "PASS foreign and unowned booking protection, invalid history cursor",
  );
  const start = Math.ceil(Date.now() / 60000) * 60000 + 60000,
    end = start + 3600000;
  const extras = {
    ...saved.extras,
    pickupAt: new Date(start).toISOString().slice(0, 16),
    dropoffAt: new Date(end).toISOString().slice(0, 16),
  };
  await prisma.booking.create({
    data: {
      ...stored,
      id: "history_live",
      requestKey: randomUUID(),
      pickupAt: new Date(start),
      dropoffAt: new Date(end),
      startDate: new Date(start),
      endDate: new Date(end),
      checkoutSnapshot: { ...stored.checkoutSnapshot, extras },
    },
  });
  const live = await context.newPage();
  await live.clock.install({ time: new Date(start - 1000) });
  await live.goto(origin + "/bookings/history_live");
  await live.getByText("Upcoming", { exact: true }).waitFor();
  await live.clock.fastForward(1000);
  await live.getByText("Active", { exact: true }).waitFor();
  await live.clock.fastForward(3600000);
  await live.getByText("Completed", { exact: true }).waitFor();
  await live.close();
  console.log(
    "PASS status changes at pickup and return while page remains open",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  const apiPort = Number(new URL(apiUrl).port);
  await app.close();
  app = undefined;
  await page.goto(origin + "/bookings");
  await page
    .getByRole("heading", { name: "Could not load your booking information" })
    .waitFor();
  app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(apiPort, "127.0.0.1");
  await page.getByRole("button", { name: "Try again" }).click();
  await page
    .getByRole("heading", { name: "Your bookings", exact: true })
    .waitFor();
  console.log("PASS API outage error state and retry recovery");
} finally {
  await browser?.close();
  if (next?.pid && next.exitCode === null) {
    try {
      process.kill(-next.pid, "SIGTERM");
    } catch {}
    await Promise.race([new Promise((r) => next.once("exit", r)), delay(3000)]);
  }
  await app?.close();
  await notifications?.close();
  await identity?.close();
  if (containerId) run("docker", ["rm", "-f", "-v", containerId]);
  if (mailContainerId) run("docker", ["rm", "-f", "-v", mailContainerId]);
}
