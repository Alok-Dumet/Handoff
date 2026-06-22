jest.mock('@handoff/contracts', () => ({
  CreateReservationPaymentSessionSchema: {
    safeParse: jest.fn((value: unknown) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'reservationId' in value
      ) {
        return { success: true, data: value };
      }

      return { success: false, error: { issues: ['invalid request'] } };
    }),
  },
  StripeReservationPaymentWebhookEventSchema: {
    safeParse: jest.fn((value: unknown) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'providerEventId' in value
      ) {
        return { success: true, data: value };
      }

      return { success: false, error: { issues: ['invalid webhook'] } };
    }),
  },
}));

import { BadRequestException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  it('validates and forwards reservation payment session requests', async () => {
    const paymentsService = {
      createReservationSession: jest.fn().mockResolvedValue({
        providerSessionId: 'pi_mock_booking_123',
      }),
    };
    const controller = new PaymentsController(paymentsService as never);

    const result = await controller.createReservationSession({
      reservationId: 'booking_123',
      mode: 'authorize',
    });

    expect(paymentsService.createReservationSession).toHaveBeenCalledWith({
      reservationId: 'booking_123',
      mode: 'authorize',
    });
    expect(result).toEqual({ providerSessionId: 'pi_mock_booking_123' });
  });

  it('rejects malformed payment session requests', () => {
    const controller = new PaymentsController({
      createReservationSession: jest.fn(),
    } as never);

    expect(() => controller.createReservationSession({})).toThrow(
      BadRequestException,
    );
  });

  it('validates and forwards Stripe webhook events', async () => {
    const paymentsService = {
      createReservationSession: jest.fn(),
      handleStripeWebhook: jest.fn().mockResolvedValue({
        received: true,
        reservationId: 'booking_123',
        paymentState: 'paid',
      }),
    };
    const controller = new PaymentsController(paymentsService as never);

    const result = await controller.handleStripeWebhook(
      stripeWebhookEvent,
      'local_mock',
    );

    expect(paymentsService.handleStripeWebhook).toHaveBeenCalledWith(
      stripeWebhookEvent,
      'local_mock',
    );
    expect(result.paymentState).toBe('paid');
  });

  it('rejects malformed Stripe webhook events', () => {
    const controller = new PaymentsController({
      createReservationSession: jest.fn(),
      handleStripeWebhook: jest.fn(),
    } as never);

    expect(() => controller.handleStripeWebhook({}, 'local_mock')).toThrow(
      BadRequestException,
    );
  });
});

const stripeWebhookEvent = {
  provider: 'stripe',
  providerEventId: 'evt_123',
  providerSessionId: 'pi_mock_booking_123',
  reservationId: 'booking_123',
  type: 'payment_intent.succeeded',
};
