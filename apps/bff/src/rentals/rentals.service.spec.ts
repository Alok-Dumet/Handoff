jest.mock('@handoff/contracts', () => ({
  CurrentRentalSchema: { parse: (value: unknown) => value },
}));

import { RentalsService } from './rentals.service';

describe('RentalsService', () => {
  it('returns a typed current rental status', () => {
    const service = new RentalsService();

    const result = service.getCurrentRental();

    expect(result).toEqual({
      rentalId: 'rental_demo_001',
      reservationId: 'booking_demo_001',
      vehicleId: 'veh_001',
      customerId: 'customer_demo_001',
      status: 'not-started',
      pickupLocation: 'BOS Terminal B',
      returnLocation: 'BOS Terminal B',
    });
  });
});
