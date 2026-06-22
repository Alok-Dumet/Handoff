jest.mock('@handoff/contracts', () => ({
  ReservationListSchema: { parse: (value: unknown) => value },
  ReservationSummarySchema: { parse: (value: unknown) => value },
}));

import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const bookingsService = {
    findAll: jest.fn(),
  };

  afterEach(() => {
    bookingsService.findAll.mockReset();
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
    const service = new ReservationsService(bookingsService as never);

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

  it('returns reservation domain capabilities without duplicating booking logic', () => {
    const service = new ReservationsService(bookingsService as never);

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
