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
  rentalState,
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
    "/bookings",
    "/bookings?cursor=booking_123",
    "/bookings/booking_123",
  ])
    assert.equal(safeReturnTo(target), target);
});

test("rental lifecycle changes at exact UTC boundaries without changing booking status", () => {
  const booking = {
    status: "confirmed",
    startDate: "2027-01-01",
    endDate: "2027-01-02",
    extras: { pickupAt: "2027-01-01T10:00", dropoffAt: "2027-01-02T10:00" },
  };
  for (const [time, state] of [
    ["2027-01-01T09:59:59.999Z", "Upcoming"],
    ["2027-01-01T10:00:00Z", "Active"],
    ["2027-01-02T09:59:59.999Z", "Active"],
    ["2027-01-02T10:00:00Z", "Completed"],
    ["2027-01-03T10:00:00Z", "Completed"],
  ])
    assert.equal(rentalState(booking, Date.parse(time)), state);
  assert.equal(
    rentalState(
      { ...booking, status: "cancelled" },
      Date.parse("2027-01-01T12:00Z"),
    ),
    "Cancelled",
  );
  assert.equal(
    rentalState(
      { ...booking, status: "pending" },
      Date.parse("2027-01-03T12:00Z"),
    ),
    "Pending",
  );
  const { extras, ...legacy } = booking;
  assert.equal(rentalState(legacy, Date.parse("2027-01-01T00:00Z")), "Active");
  assert.equal(
    rentalState(legacy, Date.parse("2027-01-02T00:00Z")),
    "Completed",
  );
  assert.equal(booking.status, "confirmed");
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
