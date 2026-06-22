import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  CreateReservationPaymentSessionSchema,
  type ReservationPaymentSession,
} from '@handoff/contracts';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('reservation-sessions')
  createReservationSession(
    @Body() body: unknown,
  ): Promise<ReservationPaymentSession> {
    const result = CreateReservationPaymentSessionSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.paymentsService.createReservationSession(result.data);
  }
}
