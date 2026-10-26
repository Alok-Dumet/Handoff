import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingDetailSchema,
  BookingListSchema,
  BookingSchema,
  formatUsd,
  localDateTimeToMs,
  type Booking,
  type BookingDetail,
  type CreateBooking,
  type CreateBookingWithExtras,
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

  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found' });
    }

    return BookingSchema.parse(toContractBooking(booking));
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

  /**
   * Create a booking from the purchase page, storing the rental window,
   * selected extras, and the totals the BFF computed.
   *
   * The overlap check uses the precise pick-up/drop-off timestamps rather
   * than whole days: a car returned at 10:00 is genuinely available to
   * someone collecting it at 14:00 the same day, and blocking that would
   * lose real bookings.
   */
  async createWithExtras(
    input: CreateBookingWithExtras,
  ): Promise<BookingDetail> {
    const { extras } = input;
    const pickupAt = new Date(localDateTimeToMs(extras.pickupAt));
    const dropoffAt = new Date(localDateTimeToMs(extras.dropoffAt));

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
      select: { id: true },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${input.vehicleId} not found`);
    }

    // Both branches must exist. Validated as non-empty strings upstream, but
    // only the database can say whether they name real locations.
    const locationIds = [
      ...new Set([extras.pickupLocationId, extras.dropoffLocationId]),
    ];
    const found = await this.prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true },
    });
    if (found.length !== locationIds.length) {
      const known = new Set(found.map((l) => l.id));
      const missing = locationIds.filter((id) => !known.has(id));
      throw new NotFoundException(`Unknown location(s): ${missing.join(', ')}`);
    }

    const conflict = await this.prisma.booking.findFirst({
      where: {
        vehicleId: input.vehicleId,
        status: { in: ['pending', 'confirmed'] },
        // Compare against the precise window where one was recorded, and
        // fall back to the date-only columns for older bookings.
        AND: [
          {
            OR: [
              { pickupAt: { lt: dropoffAt } },
              { pickupAt: null, startDate: { lt: dropoffAt } },
            ],
          },
          {
            OR: [
              { dropoffAt: { gt: pickupAt } },
              { dropoffAt: null, endDate: { gt: pickupAt } },
            ],
          },
        ],
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException('Vehicle is unavailable for those dates');
    }

    const booking = await this.prisma.booking.create({
      data: {
        id: `booking_${randomUUID()}`,
        vehicleId: input.vehicleId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        pickupLocationId: extras.pickupLocationId,
        dropoffLocationId: extras.dropoffLocationId,
        pickupAt,
        dropoffAt,
        addOnIds: extras.addOnIds,
        protectionPlanId: extras.protectionPlanId,
        acceptedTermsVersion: extras.acceptedTermsVersion,
        subtotalCents: input.subtotalCents,
        taxCents: input.taxCents,
        totalCents: input.totalCents,
      },
    });

    return BookingDetailSchema.parse({
      ...toContractBooking(booking),
      extras,
      subtotalCents: input.subtotalCents,
      taxCents: input.taxCents,
      totalCents: input.totalCents,
      totalLabel: formatUsd(input.totalCents),
    });
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
