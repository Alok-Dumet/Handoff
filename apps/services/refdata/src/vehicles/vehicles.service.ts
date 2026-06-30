import { Injectable, NotFoundException } from '@nestjs/common';
import { type Vehicle, type VehicleFilter } from '@handoff/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filter: VehicleFilter = {}): Promise<Vehicle[]> {
    // Translate the validated filter into a Prisma where clause. Absent
    // fields are simply omitted, so an empty filter returns everything.
    const where: Record<string, unknown> = {};

    if (filter.classes?.length) {
      where.class = { in: filter.classes };
    }
    if (filter.transmission) {
      where.transmission = filter.transmission;
    }
    if (filter.minSeats !== undefined) {
      where.seats = { gte: filter.minSeats };
    }
    if (
      filter.minPricePerDay !== undefined ||
      filter.maxPricePerDay !== undefined
    ) {
      where.pricePerDay = {
        ...(filter.minPricePerDay !== undefined && {
          gte: filter.minPricePerDay,
        }),
        ...(filter.maxPricePerDay !== undefined && {
          lte: filter.maxPricePerDay,
        }),
      };
    }

    // Join the pick-up location so the response matches VehicleSchema.
    // Distance sorting is handled by the BFF (Haversine), not here.
    return this.prisma.vehicle.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { location: true },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!vehicle) {
      throw new NotFoundException({ message: 'Vehicle not found' });
    }

    return vehicle;
  }
}
