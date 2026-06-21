import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingRequestError, createBooking, getBookings } from "./client-api";

const booking = {
  vehicleId: "veh_001",
  customerName: "Test Customer",
  customerEmail: "test@example.com",
  startDate: "2026-07-01",
  endDate: "2026-07-02",
  id: "booking_123",
  status: "pending",
  createdAt: "2026-06-21T12:00:00.000Z",
};

const bookingJourneyResponse = {
  booking,
  nextJourney: {
    type: "pre-check-in",
    label: "Pre-check-in",
    path: "/journeys/pre-check-in",
    ctaLabel: "Start check-in",
    description: "Confirm trip details before pickup.",
  },
  alternatives: [],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("client API helpers", () => {
  it("creates a booking and parses the journey response", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(bookingJourneyResponse));

    await expect(
      createBooking({
        vehicleId: "veh_001",
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
      }),
    ).resolves.toEqual(bookingJourneyResponse);

    expect(fetchMock).toHaveBeenCalledWith("http://bff.test/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        vehicleId: "veh_001",
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
      }),
    });
  });

  it("maps booking conflicts to BookingRequestError with the upstream status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 409));

    await expect(
      createBooking({
        vehicleId: "veh_001",
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
      }),
    ).rejects.toMatchObject({
      constructor: BookingRequestError,
      status: 409,
      message: "Booking failed with 409",
    });
  });

  it("loads recent bookings and parses the booking list response", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([booking]));

    await expect(getBookings()).resolves.toEqual([booking]);

    expect(fetchMock).toHaveBeenCalledWith("http://bff.test/bookings");
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
