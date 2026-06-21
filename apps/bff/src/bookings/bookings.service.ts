import { HttpException, Injectable } from '@nestjs/common';
import {
  BookingListSchema,
  BookingSchema,
  type Booking,
  type CreateBooking,
} from '@handoff/contracts';

@Injectable()
export class BookingsService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? 'http://localhost:3002';

  async findAll(): Promise<Booking[]> {
    const res = await fetch(`${this.refdataUrl}/bookings`);

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return BookingListSchema.parse(await res.json());
  }

  async create(input: CreateBooking): Promise<Booking> {
    const res = await fetch(`${this.refdataUrl}/bookings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return BookingSchema.parse(await res.json());
  }
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
