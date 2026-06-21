import {
  BookingJourneyResponseSchema,
  BookingListSchema,
  CreateBookingSchema,
  type Booking,
  type BookingJourneyResponse,
  type CreateBooking,
} from "@handoff/contracts";

function getPublicBffUrl() {
  return process.env.NEXT_PUBLIC_BFF_URL ?? "http://localhost:3001";
}

export class BffRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class BookingRequestError extends BffRequestError {}

export async function createBooking(
  input: CreateBooking,
): Promise<BookingJourneyResponse> {
  const payload = CreateBookingSchema.parse(input);

  const res = await fetch(`${getPublicBffUrl()}/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new BookingRequestError(`Booking failed with ${res.status}`, res.status);
  }

  return BookingJourneyResponseSchema.parse(await res.json());
}

export async function getBookings(): Promise<Booking[]> {
  const res = await fetch(`${getPublicBffUrl()}/bookings`);

  if (!res.ok) {
    throw new BffRequestError(`Bookings failed with ${res.status}`, res.status);
  }

  return BookingListSchema.parse(await res.json());
}
