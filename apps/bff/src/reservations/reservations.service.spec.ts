jest.mock('@handoff/contracts', () => ({
  ReservationSummarySchema: { parse: (value: unknown) => value },
}));

import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  it('returns reservation domain capabilities without duplicating booking logic', () => {
    const service = new ReservationsService();

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
