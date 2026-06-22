import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BookingRequestError,
  createBooking,
  createReservationPaymentSession,
  getBookings,
  getPreCheckInWorkflow,
  submitPreCheckInWorkflow,
} from "./client-api";

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

  it("starts a reservation payment session through the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const paymentSession = {
      provider: "stripe",
      providerSessionId: "pi_mock_booking_123",
      reservationId: "booking_123",
      mode: "authorize",
      amountCents: 12600,
      currency: "usd",
      status: "requires_capture",
      clientSecret: "pi_mock_booking_123_secret_local",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(paymentSession));

    await expect(
      createReservationPaymentSession({
        reservationId: "booking_123",
        mode: "authorize",
      }),
    ).resolves.toEqual(paymentSession);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/payments/reservation-sessions",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId: "booking_123",
          mode: "authorize",
        }),
      },
    );
  });

  it("loads a pre-check-in workflow from the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(preCheckInWorkflow));

    await expect(getPreCheckInWorkflow("booking_123")).resolves.toEqual(
      preCheckInWorkflow,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/journeys/pre-check-in/booking_123",
    );
  });

  it("submits a pre-check-in workflow through the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ...preCheckInWorkflow, status: "completed" }));

    await expect(
      submitPreCheckInWorkflow({
        reservationId: "booking_123",
        driver: preCheckInWorkflow.driver,
        pickup: preCheckInWorkflow.pickup,
        trip: preCheckInWorkflow.trip,
      }),
    ).resolves.toMatchObject({ status: "completed" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/journeys/pre-check-in",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId: "booking_123",
          driver: preCheckInWorkflow.driver,
          pickup: preCheckInWorkflow.pickup,
          trip: preCheckInWorkflow.trip,
        }),
      },
    );
  });
});

const preCheckInWorkflow = {
  type: "pre-check-in",
  reservationId: "booking_123",
  status: "not_started",
  driver: {
    fullName: "Demo Customer",
    email: "demo@example.com",
    phone: "555-0199",
  },
  pickup: {
    locationName: "Downtown branch",
    date: "2026-07-01",
    time: "09:00",
  },
  trip: {
    flightNumber: "HA123",
    notes: "Arriving with two bags.",
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
