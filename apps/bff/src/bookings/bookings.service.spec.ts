jest.mock('@handoff/contracts', () => ({
  BookingSchema: { parse: (value: unknown) => value },
  BookingListSchema: { parse: (value: unknown) => value },
  BookingJourneyResponseSchema: { parse: (value: unknown) => value },
}));

import { HttpException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  const originalFetch = global.fetch;
  const journeysService = {
    resolve: jest.fn().mockReturnValue({
      bookingId: 'booking_123',
      nextJourney: {
        type: 'pre-check-in',
        label: 'Pre-check-in',
        path: '/journeys/pre-check-in',
        ctaLabel: 'Start check-in',
      },
      alternatives: [],
    }),
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    journeysService.resolve.mockClear();
  });

  it('forwards a booking request to refdata and validates the response', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'booking_123',
          vehicleId: 'veh_001',
          customerName: 'Demo Customer',
          customerEmail: 'demo@example.com',
          startDate: '2026-06-21',
          endDate: '2026-06-22',
          status: 'pending',
          createdAt: '2026-06-21T12:00:00.000Z',
        }),
    });
    global.fetch = fetchMock;

    const service = new BookingsService(journeysService as never);
    const result = await service.create({
      vehicleId: 'veh_001',
      customerName: 'Demo Customer',
      customerEmail: 'demo@example.com',
      startDate: '2026-06-21',
      endDate: '2026-06-22',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'veh_001',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
      }),
    });
    expect(journeysService.resolve).toHaveBeenCalledWith({
      bookingId: 'booking_123',
      vehicleId: 'veh_001',
      customerEmail: 'demo@example.com',
      bookingStatus: 'pending',
      signals: {
        checkedInEligible: true,
        biometricEligible: false,
        receiptAvailable: false,
        upgradeAvailable: false,
      },
    });
    expect(result.booking.status).toBe('pending');
    expect(result.nextJourney.type).toBe('pre-check-in');
  });

  it('returns recent bookings from refdata', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 'booking_123',
            vehicleId: 'veh_001',
            customerName: 'Demo Customer',
            customerEmail: 'demo@example.com',
            startDate: '2026-06-21',
            endDate: '2026-06-22',
            status: 'pending',
            createdAt: '2026-06-21T12:00:00.000Z',
          },
        ]),
    });
    global.fetch = fetchMock;

    const service = new BookingsService(journeysService as never);
    const bookings = await service.findAll();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/bookings');
    expect(bookings).toHaveLength(1);
  });

  it('preserves refdata error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Vehicle not found' }),
    });

    const service = new BookingsService(journeysService as never);

    await expect(
      service.create({
        vehicleId: 'missing',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
      }),
    ).rejects.toMatchObject<HttpException>({
      message: 'Vehicle not found',
    });
  });

  it('preserves refdata conflict status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({ message: 'Vehicle is unavailable for those dates' }),
    });

    const service = new BookingsService(journeysService as never);

    await expect(
      service.create({
        vehicleId: 'veh_001',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
      }),
    ).rejects.toMatchObject<HttpException>({
      message: 'Vehicle is unavailable for those dates',
    });
  });
});
