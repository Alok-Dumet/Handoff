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
});
