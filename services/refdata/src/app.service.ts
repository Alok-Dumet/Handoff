import { Injectable } from '@nestjs/common';
import { vehicleSchema, type Vehicle } from '@handoff/contracts';

@Injectable()
export class AppService {
  getVehicles(): Vehicle[] {
    const vehicles: Vehicle[] = [
      {
        id: 'v1',
        make: 'Toyota',
        model: 'Corolla',
        year: 2023,
        category: 'economy',
        pricePerDay: 4500,
        currency: 'USD',
        seats: 5,
        location: 'LAX',
        available: true,
      },
      {
        id: 'v2',
        make: 'Jeep',
        model: 'Wrangler',
        year: 2024,
        category: 'suv',
        pricePerDay: 9000,
        currency: 'USD',
        seats: 5,
        location: 'LAX',
        available: true,
      },
    ];
    // validate our own output against the contract (catches drift early)
    return vehicles.map((v) => vehicleSchema.parse(v));
  }
}
