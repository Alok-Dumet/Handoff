import { HttpException, Injectable, NotFoundException } from "@nestjs/common";
import {
  BookingListSchema,
  ReservationDetailSchema,
  ReservationListSchema,
  type Booking,
  type ReservationDetail,
  type ReservationListItem,
} from "@handoff/contracts";

@Injectable()
export class ReservationsService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? "http://localhost:3002";

  async findAll(): Promise<ReservationListItem[]> {
    const bookings = await this.getBookings();

    return ReservationListSchema.parse(bookings.map(toListItem));
  }

  async findOne(id: string): Promise<ReservationDetail> {
    const bookings = await this.getBookings();
    const booking = bookings.find((item) => item.id === id);

    if (!booking) {
      throw new NotFoundException({ message: "Reservation not found" });
    }

    return ReservationDetailSchema.parse({
      ...toListItem(booking),
      vehicleLabel: booking.vehicleId,
      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
      },
      nextJourney: defaultNextJourney,
      createdAt: booking.createdAt,
    });
  }

  private async getBookings(): Promise<Booking[]> {
    const res = await fetch(`${this.refdataUrl}/bookings`);

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return BookingListSchema.parse(await res.json());
  }
}

const defaultNextJourney = {
  type: "pre-check-in",
  label: "Pre-check-in",
  path: "/journeys/pre-check-in",
  ctaLabel: "Start check-in",
  description:
    "Confirm driver, contact, and pickup details before arriving at the branch.",
} as const;

function toListItem(booking: Booking): ReservationListItem {
  return {
    id: booking.id,
    vehicleId: booking.vehicleId,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    paymentState: "not_started",
    detailHref: `/reservations/${booking.id}`,
    nextActionLabel: defaultNextJourney.ctaLabel,
    nextActionHref: defaultNextJourney.path,
  };
}

async function toUpstreamException(res: Response): Promise<HttpException> {
  let body: string | Record<string, unknown> =
    `refdata responded ${res.status}`;
  try {
    const jsonBody: unknown = await res.json();
    body =
      typeof jsonBody === "object" && jsonBody !== null
        ? (jsonBody as Record<string, unknown>)
        : String(jsonBody);
  } catch {
    // Keep the fallback body when refdata did not return JSON.
  }

  return new HttpException(body, res.status);
}
