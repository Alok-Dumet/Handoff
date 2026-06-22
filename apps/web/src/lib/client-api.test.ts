import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BookingRequestError,
  createBooking,
  createReservationPaymentSession,
  getEReceiptWorkflow,
  getIdentityVerificationWorkflow,
  getBookings,
  getPreCheckInWorkflow,
  startIdentityVerificationWorkflow,
  submitPreCheckInWorkflow,
  updateEReceiptDeliveryPreference,
  updateIdentityVerificationStatus,
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

  it("loads an identity verification workflow from the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(identityWorkflow));

    await expect(getIdentityVerificationWorkflow("booking_123")).resolves.toEqual(
      identityWorkflow,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/journeys/identity-verification/booking_123",
    );
  });

  it("starts identity verification through the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const startedWorkflow = {
      ...identityWorkflow,
      status: "handoff_created",
      providerReference: "idv_mock_booking_123",
      handoffUrl: "https://identity.local/handoff/idv_mock_booking_123",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(startedWorkflow));

    await expect(
      startIdentityVerificationWorkflow({ reservationId: "booking_123" }),
    ).resolves.toEqual(startedWorkflow);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/journeys/identity-verification/start",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reservationId: "booking_123" }),
      },
    );
  });

  it("updates identity verification status through the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const verifiedWorkflow = {
      ...identityWorkflow,
      status: "verified",
      providerReference: "idv_mock_booking_123",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(verifiedWorkflow));

    await expect(
      updateIdentityVerificationStatus({
        reservationId: "booking_123",
        status: "verified",
      }),
    ).resolves.toEqual(verifiedWorkflow);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/journeys/identity-verification/status",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId: "booking_123",
          status: "verified",
        }),
      },
    );
  });

  it("loads an e-receipt workflow from the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(eReceiptWorkflow));

    await expect(getEReceiptWorkflow("booking_123")).resolves.toEqual(
      eReceiptWorkflow,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/journeys/e-receipt/booking_123",
    );
  });

  it("updates e-receipt delivery preference through the BFF", async () => {
    vi.stubEnv("NEXT_PUBLIC_BFF_URL", "http://bff.test");
    const downloadedWorkflow = {
      ...eReceiptWorkflow,
      status: "ready",
      deliveryPreference: "download",
      message: "Receipt ready for download.",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(downloadedWorkflow));

    await expect(
      updateEReceiptDeliveryPreference({
        reservationId: "booking_123",
        deliveryPreference: "download",
      }),
    ).resolves.toEqual(downloadedWorkflow);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/journeys/e-receipt/delivery-preference",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId: "booking_123",
          deliveryPreference: "download",
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

const identityWorkflow = {
  type: "biometric",
  reservationId: "booking_123",
  status: "not_started",
  provider: "mock-identity-provider",
  message: "Identity verification has not started.",
  updatedAt: "2026-06-22T12:00:00.000Z",
};

const eReceiptWorkflow = {
  type: "e-receipt",
  reservationId: "booking_123",
  status: "sent",
  deliveryPreference: "email",
  deliveryEmail: "test@example.com",
  receiptNumber: "rcpt_booking_123",
  lineItems: [
    { label: "2024 Toyota Corolla", amountCents: 8400 },
    { label: "Taxes and fees", amountCents: 1008 },
  ],
  subtotalCents: 8400,
  taxCents: 1008,
  totalCents: 9408,
  updatedAt: "2026-06-22T12:00:00.000Z",
  sentAt: "2026-06-22T12:00:00.000Z",
  message: "Receipt sent to test@example.com.",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
