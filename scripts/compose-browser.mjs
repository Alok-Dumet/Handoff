import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const exec = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const project = `handoff-e2e-${randomUUID().slice(0, 8)}`;
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return String(port);
}
const [webPort, dbPort, smtpPort, inboxPort] = await Promise.all(
  Array.from({ length: 4 }, freePort),
);
const origin = `http://127.0.0.1:${webPort}`;
const inbox = `http://127.0.0.1:${inboxPort}`;
const env = {
  ...process.env,
  WEB_PORT: webPort,
  DB_PORT: dbPort,
  SMTP_PORT: smtpPort,
  INBOX_PORT: inboxPort,
  WEB_ORIGIN: origin,
  DEMO_INBOX_URL: inbox,
  HANDOFF_DB_CONTAINER: `${project}-db`,
  HANDOFF_MAIL_CONTAINER: `${project}-mail`,
};
async function compose(args) {
  try {
    const result = await exec(
      "docker",
      ["compose", "-p", project, "-f", "compose.yaml", ...args],
      { cwd: root, env, timeout: 600000, maxBuffer: 8 * 1024 * 1024 },
    );
    return result.stdout.trim();
  } catch (error) {
    throw new Error(
      `Compose ${args.join(" ")} failed:\n${error.stderr || error.message}`,
    );
  }
}
async function sql(query) {
  return compose([
    "exec",
    "-T",
    "refdata-db",
    "psql",
    "-U",
    "handoff",
    "-d",
    "refdata",
    "-tAc",
    query,
  ]);
}
async function waitFor(check, message, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    if (await check()) return;
    await delay(500);
  }
  assert.fail(message);
}
let browser;
try {
  console.log(`Starting isolated Compose project ${project}`);
  await compose(["up", "--build", "-d", "--wait", "--wait-timeout", "180"]);
  assert.equal(await sql("SELECT count(*) FROM vehicles"), "10");
  assert.equal(await sql("SELECT count(*) FROM users"), "1");
  assert.equal(await compose(["exec", "-T", "api", "id", "-u"]), "1000");
  assert.equal(await compose(["exec", "-T", "web", "id", "-u"]), "1000");
  assert.equal((await fetch(`${origin}/api/health`)).status, 200);
  console.log(
    "PASS first launch migrates and seeds an empty database; API/web are healthy and non-root",
  );
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  });
  const context = await browser.newContext();
  const errors = [],
    external = [];
  await context.route("**/*", (route) => {
    if (
      !["127.0.0.1", "localhost"].includes(
        new URL(route.request().url()).hostname,
      )
    ) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${origin}/bookings`);
  await page.waitForURL("**/sign-in?**");
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Compose Driver");
  await page.getByLabel("Email address").fill("compose@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("ComposePassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.waitForURL(`${origin}/bookings`);
  await page.getByRole("heading", { name: "No bookings yet" }).waitFor();
  const year = new Date().getUTCFullYear() + 1;
  const pickupAt = `${year}-07-01T10:00`,
    dropoffAt = `${year}-07-03T10:00`;
  await page.getByRole("link", { name: "Find a car", exact: true }).click();
  await page.getByLabel("Pick-up (UTC)", { exact: true }).fill(pickupAt);
  await page.getByLabel("Return (UTC)", { exact: true }).fill(dropoffAt);
  await page.waitForURL(url => url.searchParams.get("pickupAt") === pickupAt && url.searchParams.get("dropoffAt") === dropoffAt);
  await page.locator('a[href^="/vehicles/veh_001?"]').click();
  await page.waitForURL("**/vehicles/veh_001?**");
  await page.waitForFunction(() => {
    const image = document.querySelector("img");
    return image?.complete && image.naturalWidth > 0;
  });
  await page.getByLabel("GPS navigation").click();
  await page.waitForURL("**addOnIds=gps**");
  await page.getByLabel("I have read and agree").click();
  await page.waitForURL("**termsAccepted=**");
  const submitted = page.waitForResponse(
    (r) => r.url().endsWith("/api/bookings") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Reserve car", exact: true }).click();
  const response = await submitted;
  assert.equal(response.status(), 201);
  const input = response.request().postDataJSON();
  const { booking } = await response.json();
  await page.waitForURL("**/confirmation");
  await page
    .getByRole("status")
    .filter({ hasText: "Confirmation email sent to compose@example.com" })
    .waitFor();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Open local demo inbox" }).click();
  const popup = await popupPromise;
  await popup
    .getByText(`Your HandOff reservation ${booking.id}`, { exact: true })
    .waitFor();
  await popup.close();
  assert.equal(await page.getByRole("link", { name: "Your bookings", exact: true }).count(), 0);
  assert.equal(await page.getByRole("link", { name: "Browse cars", exact: true }).count(), 0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  assert.equal(await page.locator("header").evaluate(header => header.getBoundingClientRect().top), 0);
  await page.getByRole("link", { name: "Account", exact: true }).click();
  await page.waitForURL(`${origin}/account`);
  assert.equal(await page.getByRole("link", { name: "Browse cars", exact: true }).count(), 0);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Vehicles", exact: true }).click();
  await page.waitForURL(`${origin}/vehicles`);
  assert.equal(await page.getByRole("button", { name: "Find available cars" }).count(), 0);
  await page.getByLabel("Pick-up (UTC)", { exact: true }).fill(pickupAt);
  await page.waitForURL(url => url.searchParams.get("pickupAt") === pickupAt);
  assert.equal(await page.locator('a[href^="/vehicles/veh_001?"]').count(), 0);
  await page.getByLabel("Pick-up (UTC)", { exact: true }).fill("");
  await page.waitForURL(url => !url.searchParams.has("pickupAt"));
  await page.locator('a[href="/vehicles/veh_001"]').waitFor();
  await page.getByLabel("Return (UTC)", { exact: true }).fill(dropoffAt);
  await page.waitForURL(url => url.searchParams.get("dropoffAt") === dropoffAt);
  assert.equal(await page.locator('a[href^="/vehicles/veh_001?"]').count(), 0);
  await page.getByRole("link", { name: "Bookings", exact: true }).click();
  await page.waitForURL(`${origin}/bookings`);
  await page.locator(`a[href="/bookings/${booking.id}"]`).click();
  await page
    .getByRole("heading", { name: "Booking details", exact: true })
    .waitFor();
  await page.getByText(booking.totalLabel, { exact: true }).waitFor();
  await page.getByText("GPS navigation", { exact: true }).waitFor();
  console.log(
    "PASS register, date search, extras, checkout, captured email and history/details in production containers",
  );

  const headers = {
    "Content-Type": "application/json",
    "X-Handoff-CSRF": "1",
    Origin: origin,
  };
  const retry = await context.request.post(`${origin}/api/bookings`, {
    headers,
    data: input,
  });
  assert.equal(retry.status(), 201);
  assert.equal((await retry.json()).booking.id, booking.id);
  const isAvailable = async (start, end) =>
    (
      await (
        await fetch(
          `${origin}/api/vehicles?${new URLSearchParams({ pickupAt: start, dropoffAt: end })}`,
        )
      ).json()
    ).some((v) => v.id === "veh_001");
  assert.equal(
    await isAvailable(`${year}-07-04T09:59`, `${year}-07-05T10:00`),
    false,
  );
  assert.equal(
    await isAvailable(`${year}-07-04T10:00`, `${year}-07-05T10:00`),
    true,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  console.log(
    "PASS retry idempotency, exact 24-hour availability boundary and mobile receipt",
  );

  await compose(["stop", "mailpit"]);
  const vehicle = await (await fetch(`${origin}/api/vehicles/veh_002`)).json();
  const quote = await (
    await fetch(
      `${origin}/api/quote?${new URLSearchParams({ vehicleId: vehicle.id, pickupAt, dropoffAt, protectionPlanId: "protection_none" })}`,
    )
  ).json();
  const terms = await (await fetch(`${origin}/api/terms`)).json();
  const second = await context.request.post(`${origin}/api/bookings`, {
    headers,
    data: {
      vehicleId: vehicle.id,
      requestKey: randomUUID(),
      expectedTotalCents: quote.totalCents,
      extras: {
        pickupAt,
        dropoffAt,
        pickupLocationId: vehicle.pickupLocationId,
        dropoffLocationId: vehicle.pickupLocationId,
        addOnIds: [],
        protectionPlanId: "protection_none",
        acceptedTermsVersion: terms.version,
      },
    },
  });
  assert.equal(second.status(), 201);
  const secondBooking = (await second.json()).booking;
  await waitFor(
    async () =>
      (
        await (
          await context.request.get(
            `${origin}/api/bookings/${secondBooking.id}/email`,
          )
        ).json()
      ).status === "retrying",
    "mail outage schedules retry",
  );
  await sql(
    "UPDATE vehicles SET \"pricePerDay\"=123 WHERE id='veh_010'; UPDATE locations SET name='Preserved branch' WHERE id='loc_lax'; UPDATE users SET name='Preserved demo' WHERE email='demo@handoff.local';",
  );
  const snapshotQuery =
    "SELECT (SELECT count(*) FROM bookings), (SELECT count(*) FROM users), (SELECT count(*) FROM vehicles), (SELECT \"pricePerDay\" FROM vehicles WHERE id='veh_010'), (SELECT name FROM locations WHERE id='loc_lax'), (SELECT name FROM users WHERE email='demo@handoff.local')";
  const snapshot = await sql(snapshotQuery);
  await compose(["stop"]);
  await compose(["start"]);
  await waitFor(
    async () => {
      const services = (await compose(["ps", "--all", "--format", "json"]))
        .split("\n")
        .filter(Boolean)
        .flatMap((line) => JSON.parse(line));
      return (
        services.length === 4 &&
        services.every(
          (service) =>
            service.State === "running" && service.Health === "healthy",
        )
      );
    },
    "all services become healthy after compose start",
    360,
  );
  assert.equal(await sql(snapshotQuery), snapshot);
  await page.reload();
  await page.getByText(booking.totalLabel, { exact: true }).waitFor();
  await waitFor(
    async () =>
      (
        await (
          await context.request.get(
            `${origin}/api/bookings/${secondBooking.id}/email`,
          )
        ).json()
      ).status === "sent",
    "queued confirmation resumes after restart",
  );
  assert.equal(
    (await (await fetch(`${inbox}/api/v1/messages`)).json()).total,
    2,
  );
  assert.equal(await isAvailable(pickupAt, dropoffAt), false);
  console.log(
    "PASS compose stop/start preserves accounts, sessions, bookings, edited seed data and inbox; delayed mail recovers",
  );

  await compose(["down"]); // Deliberately retain only this test project's volumes.
  await compose(["up", "-d", "--no-build", "--wait", "--wait-timeout", "180"]);
  assert.equal(await sql(snapshotQuery), snapshot);
  await page.goto(`${origin}/bookings`);
  await page.locator(`a[href="/bookings/${booking.id}"]`).waitFor();
  await page.locator(`a[href="/bookings/${secondBooking.id}"]`).waitFor();
  assert.equal(
    (await (await fetch(`${inbox}/api/v1/messages`)).json()).total,
    2,
  );
  assert.equal(await sql("SELECT count(*) FROM confirmation_emails"), "2");
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    "PASS container recreation keeps persistent data and does not duplicate seeds or emails; no browser errors/external requests",
  );
} catch (error) {
  try {
    console.error(await compose(["logs", "--tail", "20", "api", "web"]));
  } catch {}
  throw error;
} finally {
  await browser?.close();
  // This project name is generated above and never targets the user's stack.
  await compose(["down", "--volumes", "--remove-orphans"]);
}
