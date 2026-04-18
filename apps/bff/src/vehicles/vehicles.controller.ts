import { Controller, Get } from '@nestjs/common';

@Controller('api/vehicles')
export class VehiclesController {
  @Get()
  getVehicles() {
    return [
      {
        id: 'v1',
        name: 'Ford Focus',
        class: 'Economy',
        pricePerDay: 45,
        features: ['AC', 'Bluetooth', 'USB'],
      },
      {
        id: 'v2',
        name: 'BMW 3 Series',
        class: 'Premium',
        pricePerDay: 95,
        features: ['AC', 'Leather', 'Nav', 'Sunroof'],
      },
      {
        id: 'v3',
        name: 'Range Rover Sport',
        class: 'SUV',
        pricePerDay: 145,
        features: ['AC', '4WD', 'Premium Sound', 'Heated Seats'],
      },
    ];
  }
}
