import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import {
  CreateReservationPaymentSessionSchema,
  StripeReservationPaymentWebhookEventSchema,
  type PaymentWebhookResult,
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

  @Post('stripe/webhook')
  handleStripeWebhook(
    @Body() body: unknown,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<PaymentWebhookResult> {
    const result = StripeReservationPaymentWebhookEventSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.paymentsService.handleStripeWebhook(result.data, signature);
  }
}
