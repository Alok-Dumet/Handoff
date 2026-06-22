import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PaymentWebhookResultSchema,
  ReservationPaymentSessionSchema,
  VehicleSchema,
  type CreateReservationPaymentSession,
  type PaymentWebhookResult,
  type ReservationPaymentSession,
  type ReservationPaymentState,
  type StripeReservationPaymentWebhookEvent,
  type Vehicle,
} from '@handoff/contracts';
import { ReservationsService } from '../reservations/reservations.service';

@Injectable()
export class PaymentsService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? 'http://localhost:3002';

  constructor(private readonly reservationsService: ReservationsService) {}

  async createReservationSession(
    input: CreateReservationPaymentSession,
  ): Promise<ReservationPaymentSession> {
    const reservation = await this.reservationsService.findOne(
      input.reservationId,
    );
    const vehicle = await this.findVehicle(reservation.vehicleId);
    const amountCents =
      calculateRentalDays(reservation.startDate, reservation.endDate) *
      vehicle.pricePerDay *
      100;
    const providerSessionId = `pi_mock_${reservation.id}`;
    const status =
      input.mode === 'authorize'
        ? 'requires_capture'
        : 'requires_payment_method';

    const session = ReservationPaymentSessionSchema.parse({
      provider: 'stripe',
      providerSessionId,
      reservationId: reservation.id,
      mode: input.mode,
      amountCents,
      currency: 'usd',
      status,
      clientSecret: `pi_mock_${reservation.id}_secret_local`,
    });

    if (session.mode === 'authorize') {
      await this.reservationsService.updatePaymentState(reservation.id, {
        paymentState: 'authorized',
        providerSessionId,
      });
    }

    return session;
  }

  async handleStripeWebhook(
    event: StripeReservationPaymentWebhookEvent,
    signature: string | undefined,
  ): Promise<PaymentWebhookResult> {
    this.assertValidWebhookSignature(event, signature);

    const paymentState = mapStripeEventToPaymentState(event.type);
    await this.reservationsService.updatePaymentState(event.reservationId, {
      paymentState,
      providerSessionId: event.providerSessionId,
    });

    return PaymentWebhookResultSchema.parse({
      received: true,
      reservationId: event.reservationId,
      paymentState,
    });
  }

  private async findVehicle(vehicleId: string): Promise<Vehicle> {
    const res = await fetch(
      `${this.refdataUrl}/vehicles/${encodeURIComponent(vehicleId)}`,
    );

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return VehicleSchema.parse(await res.json());
  }

  private assertValidWebhookSignature(
    event: StripeReservationPaymentWebhookEvent,
    signature: string | undefined,
  ): void {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      if (signature !== 'local_mock') {
        throw new UnauthorizedException({
          message: 'Missing local Stripe webhook signature',
        });
      }

      return;
    }

    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(event))
      .digest('hex');

    if (!signature || !constantTimeEquals(signature, `sha256=${expected}`)) {
      throw new UnauthorizedException({
        message: 'Invalid Stripe webhook signature',
      });
    }
  }
}

function mapStripeEventToPaymentState(
  type: StripeReservationPaymentWebhookEvent['type'],
): ReservationPaymentState {
  if (type === 'payment_intent.amount_capturable_updated') {
    return 'authorized';
  }

  if (type === 'payment_intent.succeeded') {
    return 'paid';
  }

  if (type === 'charge.refunded') {
    return 'refunded';
  }

  return 'failed';
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function calculateRentalDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(1, Math.ceil((end - start) / millisecondsPerDay));
}

async function toUpstreamException(res: Response): Promise<HttpException> {
  let body: string | Record<string, unknown> =
    `refdata responded ${res.status}`;
  try {
    const jsonBody: unknown = await res.json();
    body =
      typeof jsonBody === 'object' && jsonBody !== null
        ? (jsonBody as Record<string, unknown>)
        : String(jsonBody);
  } catch {
    // Keep the fallback body when refdata did not return JSON.
  }

  return new HttpException(body, res.status);
}
