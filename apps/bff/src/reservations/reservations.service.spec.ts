jest.mock('@handoff/contracts', () => ({
  ReservationDetailSchema: { parse: (value: unknown) => value },
  ReservationListSchema: { parse: (value: unknown) => value },
  ReservationSummarySchema: { parse: (value: unknown) => value },
}));

import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const bookingsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
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
    bookingsService.findAll.mockReset();
    bookingsService.findOne.mockReset();
    journeysService.resolve.mockClear();
  });

  it('maps bookings into reservation list items', async () => {
    bookingsService.findAll.mockResolvedValue([
      {
        id: 'booking_123',
        vehicleId: 'veh_001',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
        status: 'confirmed',
        createdAt: '2026-06-21T12:00:00.000Z',
      },
    ]);
    const service = new ReservationsService(
      bookingsService as never,
      journeysService as never,
    );

    const result = await service.findAll();

    expect(result).toEqual([
      {
        id: 'booking_123',
        vehicleId: 'veh_001',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
        status: 'confirmed',
        paymentState: 'not_started',
        detailHref: '/reservations/booking_123',
        nextActionLabel: 'View details',
        nextActionHref: '/reservations/booking_123',
      },
    ]);
  });

  it('returns reservation detail with next journey action', async () => {
    bookingsService.findOne.mockResolvedValue({
      id: 'booking_123',
      vehicleId: 'veh_001',
      customerName: 'Demo Customer',
      customerEmail: 'demo@example.com',
      startDate: '2026-06-21',
      endDate: '2026-06-22',
      status: 'pending',
      createdAt: '2026-06-21T12:00:00.000Z',
    });
    const service = new ReservationsService(
      bookingsService as never,
      journeysService as never,
    );

    const result = await service.findOne('booking_123');

    expect(bookingsService.findOne).toHaveBeenCalledWith('booking_123');
    expect(journeysService.resolve).toHaveBeenCalledWith({
      bookingId: 'booking_123',
      vehicleId: 'veh_001',
      customerEmail: 'demo@example.com',
      bookingStatus: 'pending',
      signals: {
        checkedInEligible: true,
        biometricEligible: false,
        receiptAvailable: false,
        upgradeAvailable: true,
      },
    });
    expect(result).toMatchObject({
      id: 'booking_123',
      customer: {
        name: 'Demo Customer',
        email: 'demo@example.com',
      },
      paymentState: 'not_started',
      nextActionLabel: 'Start check-in',
      nextActionHref: '/journeys/pre-check-in',
    });
  });

  it('returns reservation domain capabilities without duplicating booking logic', () => {
    const service = new ReservationsService(
      bookingsService as never,
      journeysService as never,
    );

    const result = service.getSummary();

    expect(result.domain).toBe('reservation');
    expect(result.capabilities).toEqual([
      { name: 'List bookings', method: 'GET', href: '/bookings' },
      { name: 'Create reservation booking', method: 'POST', href: '/bookings' },
      {
        name: 'Resolve post-booking journey',
        method: 'POST',
        href: '/journeys/resolve',
      },
    ]);
  });
});
