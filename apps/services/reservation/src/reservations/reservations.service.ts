import { HttpException, Injectable, NotFoundException } from "@nestjs/common";
import {
  BookingListSchema,
  BookingSchema,
  ReservationDetailSchema,
  ReservationListSchema,
  type Booking,
  type ReservationDetail,
  type ReservationListItem,
  type ReservationPaymentState,
  type UpdateReservationPaymentState,
} from "@handoff/contracts";

@Injectable()
export class ReservationsService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? "http://localhost:3002";
  private readonly paymentStates = new Map<string, ReservationPaymentState>();

  async findAll(): Promise<ReservationListItem[]> {
    const bookings = await this.getBookings();

    return ReservationListSchema.parse(
      bookings.map((booking) =>
        toListItem(booking, this.getPaymentState(booking.id)),
      ),
    );
  }

  async findOne(id: string): Promise<ReservationDetail> {
    const booking = await this.getBooking(id);

    return toDetail(booking, this.getPaymentState(booking.id));
  }

  async updatePaymentState(
    id: string,
    input: UpdateReservationPaymentState,
  ): Promise<ReservationDetail> {
    const booking = await this.getBooking(id);
    this.paymentStates.set(id, input.paymentState);

    return toDetail(booking, input.paymentState);
  }

  private async getBookings(): Promise<Booking[]> {
    const res = await fetch(`${this.refdataUrl}/bookings`);

    if (!res.ok) {
      throw await toUpstreamException(res);
    }

    return BookingListSchema.parse(await res.json());
  }

  private async getBooking(id: string): Promise<Booking> {
    const res = await fetch(
      `${this.refdataUrl}/bookings/${encodeURIComponent(id)}`,
    );

    if (!res.ok) {
      if (res.status === 404) {
        throw new NotFoundException({ message: "Reservation not found" });
      }

      throw await toUpstreamException(res);
    }

    return BookingSchema.parse(await res.json());
  }

  private getPaymentState(id: string): ReservationPaymentState {
    return this.paymentStates.get(id) ?? "not_started";
  }
}

function toDetail(
  booking: Booking,
  paymentState: ReservationPaymentState,
): ReservationDetail {
  return ReservationDetailSchema.parse({
    ...toListItem(booking, paymentState),
    vehicleLabel: booking.vehicleId,
    customer: {
      name: booking.customerName,
      email: booking.customerEmail,
    },
    nextJourney: defaultNextJourney,
    createdAt: booking.createdAt,
  });
}

const defaultNextJourney = {
  type: "pre-check-in",
  label: "Pre-check-in",
  path: "/journeys/pre-check-in",
  ctaLabel: "Start check-in",
  description:
    "Confirm driver, contact, and pickup details before arriving at the branch.",
} as const;

function toListItem(
  booking: Booking,
  paymentState: ReservationPaymentState,
): ReservationListItem {
  return {
    id: booking.id,
    vehicleId: booking.vehicleId,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    paymentState,
    detailHref: `/reservations/${booking.id}`,
    nextActionLabel: defaultNextJourney.ctaLabel,
    nextActionHref: `${defaultNextJourney.path}?reservationId=${encodeURIComponent(booking.id)}`,
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
