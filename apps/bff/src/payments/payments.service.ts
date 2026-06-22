import { HttpException, Injectable } from '@nestjs/common';
import {
  ReservationPaymentSessionSchema,
  VehicleListSchema,
  type CreateReservationPaymentSession,
  type ReservationPaymentSession,
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

  private async findVehicle(vehicleId: string): Promise<Vehicle> {
    const res = await fetch(`${this.refdataUrl}/vehicles`);

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    const vehicles = VehicleListSchema.parse(await res.json());
    const vehicle = vehicles.find((item) => item.id === vehicleId);

    if (!vehicle) {
      throw new HttpException({ message: 'Vehicle not found' }, 404);
    }

    return vehicle;
  }
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
