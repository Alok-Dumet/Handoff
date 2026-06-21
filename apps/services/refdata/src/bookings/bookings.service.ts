import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingListSchema,
  BookingSchema,
  type Booking,
  type CreateBooking,
} from '@handoff/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return BookingListSchema.parse(bookings.map(toContractBooking));
  }

  async create(input: CreateBooking): Promise<Booking> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${input.vehicleId} not found`);
    }

    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        vehicleId: input.vehicleId,
        status: { in: ['pending', 'confirmed'] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    });

    if (conflictingBooking) {
      throw new ConflictException('Vehicle is unavailable for those dates');
    }

    const booking = await this.prisma.booking.create({
      data: {
        id: `booking_${randomUUID()}`,
        vehicleId: input.vehicleId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        startDate,
        endDate,
      },
    });

    return BookingSchema.parse(toContractBooking(booking));
  }
}

function toContractBooking(booking: {
  id: string;
  vehicleId: string;
  customerName: string;
  customerEmail: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
}) {
  return {
    ...booking,
    startDate: booking.startDate.toISOString().slice(0, 10),
    endDate: booking.endDate.toISOString().slice(0, 10),
    createdAt: booking.createdAt.toISOString(),
  };
}
