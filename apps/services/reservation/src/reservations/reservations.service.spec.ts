jest.mock("@handoff/contracts", () => ({
  BookingListSchema: { parse: (value: unknown) => value },
  ReservationDetailSchema: { parse: (value: unknown) => value },
  ReservationListSchema: { parse: (value: unknown) => value },
}));

import { ReservationsService } from "./reservations.service";

describe("ReservationsService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("maps refdata bookings to reservation list items", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([bookingFixture]),
    });
    const service = new ReservationsService();

    const result = await service.findAll();

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3002/bookings");
    expect(result).toEqual([
      {
        id: "booking_123",
        vehicleId: "veh_001",
        customerName: "Demo Customer",
        customerEmail: "demo@example.com",
        startDate: "2026-06-21",
        endDate: "2026-06-22",
        status: "pending",
        paymentState: "not_started",
        detailHref: "/reservations/booking_123",
        nextActionLabel: "Start check-in",
        nextActionHref: "/journeys/pre-check-in",
      },
    ]);
  });

  it("returns reservation detail from refdata booking data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([bookingFixture]),
    });
    const service = new ReservationsService();

    const result = await service.findOne("booking_123");

    expect(result).toMatchObject({
      id: "booking_123",
      customer: {
        name: "Demo Customer",
        email: "demo@example.com",
      },
      nextJourney: {
        type: "pre-check-in",
        path: "/journeys/pre-check-in",
      },
    });
  });

  it("preserves refdata upstream status codes", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ message: "refdata unavailable" }),
    });
    const service = new ReservationsService();

    await expect(service.findAll()).rejects.toMatchObject({
      response: { message: "refdata unavailable" },
      status: 503,
    });
  });

  it("throws not found when reservation is missing", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    const service = new ReservationsService();

    await expect(service.findOne("missing")).rejects.toMatchObject({
      response: { message: "Reservation not found" },
      status: 404,
    });
  });
});

const bookingFixture = {
  id: "booking_123",
  vehicleId: "veh_001",
  customerName: "Demo Customer",
  customerEmail: "demo@example.com",
  startDate: "2026-06-21",
  endDate: "2026-06-22",
  status: "pending",
  createdAt: "2026-06-21T12:00:00.000Z",
};
