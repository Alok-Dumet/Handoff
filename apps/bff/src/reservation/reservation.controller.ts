import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/reservation')
export class ReservationController {
  @Get(':id')
  getReservation(@Param('id') id: string) {
    return {
      bookingRef: 'HO-2024-001',
      customerName: 'Alok Sharma',
      vehicleClass: 'Economy',
      pickupDate: '2024-03-15',
      returnDate: '2024-03-18',
      location: 'London Heathrow T5',
      status: 'confirmed',
    };
  }
}
