jest.mock('@handoff/contracts', () => ({
  CurrentRentalSchema: { parse: (value: unknown) => value },
}));

import { RentalsService } from './rentals.service';

describe('RentalsService', () => {
  it('returns a typed current rental status from reservation data', async () => {
    const reservationsService = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'booking_123',
          vehicleId: 'veh_001',
          vehicleLabel: '2024 Toyota Corolla',
          customerId: 'customer_demo@example.com',
          customerName: 'Demo Customer',
          customerEmail: 'demo@example.com',
          status: 'confirmed',
          paymentState: 'paid',
          startDate: '2026-06-21',
          endDate: '2026-06-23',
          detailHref: '/reservations/booking_123',
          nextActionLabel: 'Open reservation',
          nextActionHref: '/reservations/booking_123',
          createdAt: '2026-06-20T12:00:00.000Z',
          nextJourney: {
            type: 'e-receipt',
            label: 'E-receipt',
            path: '/journeys/e-receipt',
            ctaLabel: 'View receipt',
          },
        },
      ]),
      findOne: jest.fn().mockResolvedValue({
        id: 'booking_123',
        vehicleId: 'veh_001',
        vehicleLabel: '2024 Toyota Corolla',
        customerId: 'customer_demo@example.com',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        status: 'confirmed',
        paymentState: 'paid',
        startDate: '2026-06-21',
        endDate: '2026-06-23',
        detailHref: '/reservations/booking_123',
        nextActionLabel: 'Open reservation',
        nextActionHref: '/reservations/booking_123',
        createdAt: '2026-06-20T12:00:00.000Z',
        nextJourney: {
          type: 'e-receipt',
          label: 'E-receipt',
          path: '/journeys/e-receipt',
          ctaLabel: 'View receipt',
        },
      }),
    };

    const service = new RentalsService(reservationsService as never);
    const result = await service.getCurrentRental();

    expect(result).toMatchObject({
      rentalId: 'rental_booking_123',
      reservationId: 'booking_123',
      vehicleId: 'veh_001',
      customerId: 'customer_demo@example.com',
      customerName: 'Demo Customer',
      customerEmail: 'demo@example.com',
      status: 'active',
      reservationStatus: 'confirmed',
      paymentState: 'paid',
      vehicleLabel: '2024 Toyota Corolla',
      startDate: '2026-06-21',
      endDate: '2026-06-23',
      pickupLocation: 'Primary rental desk',
      returnLocation: 'Primary rental return desk',
      supportActions: [
        {
          label: 'View reservation',
          href: '/reservations/booking_123',
          variant: 'contained',
        },
        {
          label: 'View pre-check-in',
          href: '/journeys/pre-check-in?reservationId=booking_123',
          variant: 'outlined',
        },
      ],
    });
    expect(result.updatedAt).toEqual(expect.any(String));
    expect(reservationsService.findAll).toHaveBeenCalled();
    expect(reservationsService.findOne).toHaveBeenCalledWith('booking_123');
  });

  it('uses an explicit reservation id when provided', async () => {
    const reservationsService = {
      findAll: jest.fn(),
      findOne: jest.fn().mockResolvedValue({
        id: 'booking_456',
        vehicleId: 'veh_002',
        vehicleLabel: '2026 Toyota Camry',
        customerId: 'customer_demo@example.com',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        status: 'pending',
        paymentState: 'authorized',
        startDate: '2026-07-01',
        endDate: '2026-07-03',
        detailHref: '/reservations/booking_456',
        nextActionLabel: 'Open reservation',
        nextActionHref: '/reservations/booking_456',
        createdAt: '2026-06-20T12:00:00.000Z',
        nextJourney: {
          type: 'pre-check-in',
          label: 'Pre-check-in',
          path: '/journeys/pre-check-in',
          ctaLabel: 'Start check-in',
        },
      }),
    };

    const service = new RentalsService(reservationsService as never);
    const result = await service.getCurrentRental('booking_456');

    expect(result.reservationId).toBe('booking_456');
    expect(result.status).toBe('not-started');
    expect(reservationsService.findOne).toHaveBeenCalledWith('booking_456');
    expect(reservationsService.findAll).not.toHaveBeenCalled();
  });
});
