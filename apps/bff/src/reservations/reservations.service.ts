import { Injectable } from '@nestjs/common';
import {
  ReservationSummarySchema,
  type ReservationSummary,
} from '@handoff/contracts';

@Injectable()
export class ReservationsService {
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
