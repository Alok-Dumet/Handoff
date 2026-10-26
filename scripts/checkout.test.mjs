import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { safeReturnTo } from "../apps/web/src/lib/return-to.ts";
const require = createRequire(
  new URL("../apps/bff/package.json", import.meta.url),
);
const {
  RentalWindowSchema,
  localDateTimeToMs,
  rentalDays,
} = require("@handoff/contracts");

test("checkout login return targets stay on supported internal pages", () => {
  for (const target of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/sign-in?next=/sign-in",
    ["/vehicles/veh_001"],
  ])
    assert.equal(safeReturnTo(target), "/vehicles");
  for (const target of [
    "/vehicles/veh_001?pickupAt=2027-01-01T10%3A00",
    "/bookings/booking_123/confirmation",
  ])
    assert.equal(safeReturnTo(target), target);
});

test("rental times are UTC with exact duration limits and rounded billing days", () => {
  const window = {
    pickupLocationId: "branch",
    dropoffLocationId: "branch",
    pickupAt: "2027-03-14T01:00",
    dropoffAt: "2027-03-14T02:00",
  };
  const previous = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      assert.equal(
        localDateTimeToMs(window.pickupAt),
        Date.parse("2027-03-14T01:00Z"),
      );
      assert.ok(RentalWindowSchema.safeParse(window).success);
      assert.equal(rentalDays(window.pickupAt, "2027-03-15T01:01"), 2);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
  assert.ok(
    RentalWindowSchema.safeParse({
      ...window,
      pickupAt: "2027-01-01T00:00",
      dropoffAt: "2027-04-01T00:00",
    }).success,
  );
  assert.ok(
    !RentalWindowSchema.safeParse({
      ...window,
      pickupAt: "2027-01-01T00:00",
      dropoffAt: "2027-04-01T00:01",
    }).success,
  );
});
