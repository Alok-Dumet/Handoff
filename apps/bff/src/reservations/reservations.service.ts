import { Injectable } from '@nestjs/common';
import {
  ReservationListSchema,
  ReservationSummarySchema,
  type ReservationListItem,
  type ReservationSummary,
} from '@handoff/contracts';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly bookingsService: BookingsService) {}

  async findAll(): Promise<ReservationListItem[]> {
    const bookings = await this.bookingsService.findAll();

    return ReservationListSchema.parse(
      bookings.map((booking) => ({
        id: booking.id,
        vehicleId: booking.vehicleId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        paymentState: 'not_started',
        detailHref: `/reservations/${booking.id}`,
        nextActionLabel: 'View details',
        nextActionHref: `/reservations/${booking.id}`,
      })),
    );
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
