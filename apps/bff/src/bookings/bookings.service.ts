import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingListSchema,
  BookingJourneyResponseSchema,
  BookingSchema,
  type Booking,
  type BookingJourneyResponse,
  type CreateBooking,
} from '@handoff/contracts';
import { JourneysService } from '../journeys/journeys.service';

@Injectable()
export class BookingsService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? 'http://localhost:3002';

  constructor(private readonly journeysService: JourneysService) {}

  async findAll(): Promise<Booking[]> {
    const res = await fetch(`${this.refdataUrl}/bookings`);

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return BookingListSchema.parse(await res.json());
  }

  async findOne(id: string): Promise<Booking> {
    const bookings = await this.findAll();
    const booking = bookings.find((item) => item.id === id);

    if (!booking) {
      throw new NotFoundException({ message: 'Reservation not found' });
    }

    return booking;
  }

  async create(input: CreateBooking): Promise<BookingJourneyResponse> {
    const res = await fetch(`${this.refdataUrl}/bookings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    const booking = BookingSchema.parse(await res.json());
    const journey = this.journeysService.resolve({
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      customerEmail: booking.customerEmail,
      bookingStatus: booking.status,
      signals: {
        checkedInEligible: true,
        biometricEligible: false,
        receiptAvailable: false,
        upgradeAvailable: false,
      },
    });

    return BookingJourneyResponseSchema.parse({
      booking,
      nextJourney: journey.nextJourney,
      alternatives: journey.alternatives,
    });
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
