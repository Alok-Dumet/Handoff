import { HttpException, Injectable } from '@nestjs/common';
import {
  ReservationDetailSchema,
  ReservationListSchema,
  ReservationSummarySchema,
  type ReservationDetail,
  type ReservationListItem,
  type UpdateReservationPaymentState,
  type ReservationSummary,
} from '@handoff/contracts';

@Injectable()
export class ReservationsService {
  private readonly reservationServiceUrl =
    process.env.RESERVATION_SERVICE_URL ?? 'http://localhost:3004';

  async findAll(): Promise<ReservationListItem[]> {
    const res = await fetch(`${this.reservationServiceUrl}/reservations`);

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return ReservationListSchema.parse(await res.json());
  }

  async findOne(id: string): Promise<ReservationDetail> {
    const res = await fetch(
      `${this.reservationServiceUrl}/reservations/${encodeURIComponent(id)}`,
    );

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return ReservationDetailSchema.parse(await res.json());
  }

  async updatePaymentState(
    id: string,
    input: UpdateReservationPaymentState,
  ): Promise<ReservationDetail> {
    const res = await fetch(
      `${this.reservationServiceUrl}/reservations/${encodeURIComponent(id)}/payment-state`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      },
    );

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return ReservationDetailSchema.parse(await res.json());
  }

  getSummary(): ReservationSummary {
    return ReservationSummarySchema.parse({
      domain: 'reservation',
      description:
        'Reservation APIs coordinate booking creation and post-booking journey decisions through existing BFF routes.',
      capabilities: [
        {
          name: 'List bookings',
          method: 'GET',
          href: '/bookings',
        },
        {
          name: 'Create reservation booking',
          method: 'POST',
          href: '/bookings',
        },
        {
          name: 'Resolve post-booking journey',
          method: 'POST',
          href: '/journeys/resolve',
        },
      ],
    });
  }
}

async function toUpstreamException(res: Response): Promise<HttpException> {
  let body: string | Record<string, unknown> =
    `reservation service responded ${res.status}`;
  try {
    const jsonBody: unknown = await res.json();
    body =
      typeof jsonBody === 'object' && jsonBody !== null
        ? (jsonBody as Record<string, unknown>)
        : String(jsonBody);
  } catch {
    // Keep the fallback body when reservation service did not return JSON.
  }

  return new HttpException(body, res.status);
}
