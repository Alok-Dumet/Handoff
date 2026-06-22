jest.mock('@handoff/contracts', () => ({
  ReservationDetailSchema: { parse: (value: unknown) => value },
  ReservationListSchema: { parse: (value: unknown) => value },
}));

import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fetches reservation list items from the reservation service', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([reservationListItem]),
    });
    const service = new ReservationsService();

    const result = await service.findAll();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3004/reservations',
    );
    expect(result).toEqual([reservationListItem]);
  });

  it('fetches reservation detail from the reservation service', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(reservationDetail),
    });
    const service = new ReservationsService();

    const result = await service.findOne('booking_123');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3004/reservations/booking_123',
    );
    expect(result).toEqual(reservationDetail);
  });

  it('preserves reservation service error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Reservation not found' }),
    });
    const service = new ReservationsService();

    await expect(service.findOne('missing')).rejects.toMatchObject({
      response: { message: 'Reservation not found' },
      status: 404,
    });
  });

  it('updates reservation payment state through the reservation service', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...reservationDetail,
          paymentState: 'authorized',
        }),
    });
    const service = new ReservationsService();

    const result = await service.updatePaymentState('booking_123', {
      paymentState: 'authorized',
      providerSessionId: 'pi_mock_booking_123',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3004/reservations/booking_123/payment-state',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          paymentState: 'authorized',
          providerSessionId: 'pi_mock_booking_123',
        }),
      },
    );
    expect(result.paymentState).toBe('authorized');
  });

  it('preserves payment state update errors from the reservation service', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Reservation not found' }),
    });
    const service = new ReservationsService();

    await expect(
      service.updatePaymentState('missing', { paymentState: 'authorized' }),
    ).rejects.toMatchObject({
      response: { message: 'Reservation not found' },
      status: 404,
    });
  });
});

const reservationListItem = {
  id: 'booking_123',
  vehicleId: 'veh_001',
  customerName: 'Demo Customer',
  customerEmail: 'demo@example.com',
  startDate: '2026-06-21',
  endDate: '2026-06-22',
  status: 'pending',
  paymentState: 'not_started',
  detailHref: '/reservations/booking_123',
  nextActionLabel: 'Start check-in',
  nextActionHref: '/journeys/pre-check-in',
};

const reservationDetail = {
  ...reservationListItem,
  vehicleLabel: 'veh_001',
  customer: {
    name: 'Demo Customer',
    email: 'demo@example.com',
  },
  nextJourney: {
    type: 'pre-check-in',
    label: 'Pre-check-in',
    path: '/journeys/pre-check-in',
    ctaLabel: 'Start check-in',
  },
  createdAt: '2026-06-21T12:00:00.000Z',
};
