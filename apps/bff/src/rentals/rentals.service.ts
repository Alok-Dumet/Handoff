import { Injectable } from '@nestjs/common';
import { CurrentRentalSchema, type CurrentRental } from '@handoff/contracts';

@Injectable()
export class RentalsService {
  getCurrentRental(): CurrentRental {
    return CurrentRentalSchema.parse({
      rentalId: 'rental_demo_001',
      reservationId: 'booking_demo_001',
      vehicleId: 'veh_001',
      customerId: 'customer_demo_001',
      status: 'not-started',
      pickupLocation: 'BOS Terminal B',
      returnLocation: 'BOS Terminal B',
    });
  }
}
