jest.mock('@handoff/contracts', () => ({
  PaymentWebhookResultSchema: { parse: (value: unknown) => value },
  ReservationPaymentSessionSchema: { parse: (value: unknown) => value },
  VehicleListSchema: { parse: (value: unknown) => value },
}));

import { HttpException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const originalFetch = global.fetch;
  const reservationsService = {
    findOne: jest.fn().mockResolvedValue({
      id: 'booking_123',
      vehicleId: 'veh_001',
      customerName: 'Demo Customer',
      customerEmail: 'demo@example.com',
      startDate: '2026-06-21',
      endDate: '2026-06-24',
      status: 'pending',
      paymentState: 'not_started',
      detailHref: '/reservations/booking_123',
      nextActionLabel: 'Start check-in',
      nextActionHref: '/journeys/pre-check-in',
      vehicleLabel: 'Toyota Corolla',
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
    }),
    updatePaymentState: jest.fn().mockResolvedValue({
      id: 'booking_123',
      paymentState: 'authorized',
    }),
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    reservationsService.findOne.mockClear();
    reservationsService.updatePaymentState.mockClear();
  });

  it('creates a Stripe-compatible local authorization session for a reservation', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([vehicle]),
    });
    const service = new PaymentsService(reservationsService as never);

    const result = await service.createReservationSession({
      reservationId: 'booking_123',
      mode: 'authorize',
    });

    expect(reservationsService.findOne).toHaveBeenCalledWith('booking_123');
    expect(reservationsService.updatePaymentState).toHaveBeenCalledWith(
      'booking_123',
      {
        paymentState: 'authorized',
        providerSessionId: 'pi_mock_booking_123',
      },
    );
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/vehicles');
    expect(result).toEqual({
      provider: 'stripe',
      providerSessionId: 'pi_mock_booking_123',
      reservationId: 'booking_123',
      mode: 'authorize',
      amountCents: 12600,
      currency: 'usd',
      status: 'requires_capture',
      clientSecret: 'pi_mock_booking_123_secret_local',
    });
  });

  it('returns a payment-method-required session for pay-now mode', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([vehicle]),
    });
    const service = new PaymentsService(reservationsService as never);

    const result = await service.createReservationSession({
      reservationId: 'booking_123',
      mode: 'pay',
    });

    expect(result.status).toBe('requires_payment_method');
    expect(result.amountCents).toBe(12600);
    expect(reservationsService.updatePaymentState).not.toHaveBeenCalled();
  });

  it('preserves upstream refdata status while loading vehicle prices', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ message: 'refdata unavailable' }),
    });
    const service = new PaymentsService(reservationsService as never);

    await expect(
      service.createReservationSession({
        reservationId: 'booking_123',
        mode: 'authorize',
      }),
    ).rejects.toMatchObject<HttpException>({
      response: { message: 'refdata unavailable' },
      status: 503,
    });
  });

  it('marks a reservation paid from a validated local Stripe webhook', async () => {
    const service = new PaymentsService(reservationsService as never);

    const result = await service.handleStripeWebhook(
      {
        provider: 'stripe',
        providerEventId: 'evt_123',
        providerSessionId: 'pi_mock_booking_123',
        reservationId: 'booking_123',
        type: 'payment_intent.succeeded',
      },
      'local_mock',
    );

    expect(reservationsService.updatePaymentState).toHaveBeenCalledWith(
      'booking_123',
      {
        paymentState: 'paid',
        providerSessionId: 'pi_mock_booking_123',
      },
    );
    expect(result).toEqual({
      received: true,
      reservationId: 'booking_123',
      paymentState: 'paid',
    });
  });

  it('marks a reservation failed from a failed payment webhook', async () => {
    const service = new PaymentsService(reservationsService as never);

    await service.handleStripeWebhook(
      {
        provider: 'stripe',
        providerEventId: 'evt_124',
        providerSessionId: 'pi_mock_booking_123',
        reservationId: 'booking_123',
        type: 'payment_intent.payment_failed',
      },
      'local_mock',
    );

    expect(reservationsService.updatePaymentState).toHaveBeenCalledWith(
      'booking_123',
      {
        paymentState: 'failed',
        providerSessionId: 'pi_mock_booking_123',
      },
    );
  });

  it('rejects local Stripe webhooks without the local mock signature', async () => {
    const service = new PaymentsService(reservationsService as never);

    await expect(
      service.handleStripeWebhook(
        {
          provider: 'stripe',
          providerEventId: 'evt_123',
          providerSessionId: 'pi_mock_booking_123',
          reservationId: 'booking_123',
          type: 'payment_intent.succeeded',
        },
        undefined,
      ),
    ).rejects.toMatchObject({
      status: 401,
      response: { message: 'Missing local Stripe webhook signature' },
    });
    expect(reservationsService.updatePaymentState).not.toHaveBeenCalled();
  });
});

const vehicle = {
  id: 'veh_001',
  make: 'Toyota',
  model: 'Corolla',
  year: 2024,
  class: 'economy',
  transmission: 'automatic',
  seats: 5,
  pricePerDay: 42,
};
