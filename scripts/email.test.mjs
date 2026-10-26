import assert from "node:assert/strict";
import test from "node:test";
import { emailConfig, retryDelay } from "../apps/bff/src/email/email.config.ts";
import { confirmationMessage } from "../apps/bff/src/email/confirmation-message.ts";

test("SMTP defaults are local and authenticated SMTP requires TLS by default", () => {
  const local = emailConfig({});
  assert.equal(local.smtp.host, "127.0.0.1");
  assert.equal(local.smtp.port, 1025);
  assert.equal(local.enabled, true);
  const external = emailConfig({
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "user",
    SMTP_PASSWORD: "secret",
    WEB_ORIGIN: "https://rental.example.com",
  });
  assert.equal(external.smtp.requireTLS, true);
  assert.equal(external.origin, "https://rental.example.com");
  assert.equal(emailConfig({ SMTP_SECURE: "true" }).smtp.port, 465);
  for (const env of [
    { SMTP_PORT: "no" },
    { SMTP_PORT: "0" },
    { SMTP_SECURE: "yes" },
    { SMTP_USER: "only-user" },
    { EMAIL_FROM: "a\r\nb" },
    { WEB_ORIGIN: "javascript:alert(1)" },
  ])
    assert.throws(() => emailConfig(env));
});

test("retry delay grows exponentially and remains capped during long outages", () => {
  assert.deepEqual([1, 2, 3].map(retryDelay), [5000, 10000, 20000]);
  assert.equal(retryDelay(1000), 3600000);
});

test("confirmation messages escape untrusted content and preserve the agreed receipt", () => {
  const booking = {
    id: "booking_example",
    customerName: "<img src=x onerror=alert(1)>",
    customerEmail: "driver@example.com",
    vehicleTitle: "Car & Co",
    pickupLocationName: "Airport",
    pickupAddress: "Main <Street>",
    extras: { pickupAt: "2027-01-01T10:00", dropoffAt: "2027-01-02T10:00" },
    quote: {
      lines: [{ label: "Add-ons", amountLabel: "$8.00", detail: "GPS & seat" }],
    },
    totalLabel: "$54.75",
  };
  const message = confirmationMessage(booking, "https://rental.example.com");
  assert.ok(message.text.includes(booking.customerName));
  assert.ok(message.html.includes("&lt;img"));
  assert.ok(!message.html.includes("<img"));
  assert.ok(
    message.html.includes(
      "https://rental.example.com/bookings/booking_example",
    ),
  );
  assert.ok(message.text.includes("$54.75"));
  assert.equal(
    message.messageId,
    confirmationMessage(booking, "https://rental.example.com").messageId,
  );
});
