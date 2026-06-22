import { Injectable } from '@nestjs/common';
import {
  CurrentRentalSchema,
  type CurrentRental,
  type ReservationDetail,
} from '@handoff/contracts';
import { ReservationsService } from '../reservations/reservations.service';

@Injectable()
export class RentalsService {
  constructor(private readonly reservationsService: ReservationsService) {}

  async getCurrentRental(reservationId?: string): Promise<CurrentRental> {
    const reservation = reservationId
      ? await this.reservationsService.findOne(reservationId)
      : await this.findCurrentReservation();

    return CurrentRentalSchema.parse({
      rentalId: `rental_${reservation.id}`,
      reservationId: reservation.id,
      vehicleId: reservation.vehicleId,
      customerId: `customer_${reservation.customerEmail}`,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      status: toRentalStatus(reservation),
      reservationStatus: reservation.status,
      paymentState: reservation.paymentState,
      vehicleLabel: reservation.vehicleLabel,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      pickupLocation: this.formatPickupLocation(reservation),
      returnLocation: this.formatReturnLocation(reservation),
      supportActions: [
        {
          label: 'View reservation',
          href: reservation.detailHref,
          variant: 'contained',
        },
        {
          label: 'View pre-check-in',
          href: `/journeys/pre-check-in?reservationId=${encodeURIComponent(reservation.id)}`,
          variant: 'outlined',
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  }

  private async findCurrentReservation(): Promise<ReservationDetail> {
    const reservations = await this.reservationsService.findAll();
    const preferred =
      reservations.find((reservation) => reservation.status === 'confirmed') ??
      reservations[0];

    if (!preferred) {
      throw new Error('No reservations available for rental status');
    }

    return this.reservationsService.findOne(preferred.id);
  }

  private formatPickupLocation(reservation: ReservationDetail): string {
    return reservation.status === 'pending'
      ? 'Pickup desk confirmed after check-in'
      : 'Primary rental desk';
  }

  private formatReturnLocation(reservation: ReservationDetail): string {
    return reservation.status === 'confirmed'
      ? 'Primary rental return desk'
      : 'Same location as pickup';
  }
}

function toRentalStatus(
  reservation: ReservationDetail,
): 'not-started' | 'active' | 'completed' {
  if (reservation.status === 'cancelled') {
    return 'completed';
  }

  const today = new Date().toISOString().slice(0, 10);

  if (today < reservation.startDate) {
    return 'not-started';
  }

  if (today > reservation.endDate) {
    return 'completed';
  }

  if (reservation.status === 'confirmed') {
    return 'active';
  }

  return 'not-started';
}
