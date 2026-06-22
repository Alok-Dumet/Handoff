import { Injectable } from '@nestjs/common';
import {
  ReservationDetailSchema,
  ReservationListSchema,
  ReservationSummarySchema,
  type ReservationDetail,
  type ReservationListItem,
  type ReservationSummary,
} from '@handoff/contracts';
import { BookingsService } from '../bookings/bookings.service';
import { JourneysService } from '../journeys/journeys.service';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly journeysService: JourneysService,
  ) {}

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

  async findOne(id: string): Promise<ReservationDetail> {
    const booking = await this.bookingsService.findOne(id);
    const journey = this.journeysService.resolve({
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      customerEmail: booking.customerEmail,
      bookingStatus: booking.status,
      signals: {
        checkedInEligible: true,
        biometricEligible: false,
        receiptAvailable: booking.status !== 'pending',
        upgradeAvailable: booking.status === 'pending',
      },
    });

    return ReservationDetailSchema.parse({
      id: booking.id,
      vehicleId: booking.vehicleId,
      vehicleLabel: booking.vehicleId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
      },
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      paymentState: 'not_started',
      detailHref: `/reservations/${booking.id}`,
      nextActionLabel: journey.nextJourney.ctaLabel,
      nextActionHref: journey.nextJourney.path,
      nextJourney: journey.nextJourney,
      createdAt: booking.createdAt,
    });
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
