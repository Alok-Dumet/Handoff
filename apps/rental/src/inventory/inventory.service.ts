import { Injectable, NotFoundException } from "@nestjs/common";
import {
  VehicleListSchema,
  VehicleSchema,
  type Vehicle,
  type VehicleFilter,
} from "@handoff/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { conflictingWindow } from "../bookings/availability";

/** Internal data access shared by vehicle presentation and quote calculation. */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: VehicleFilter = {}): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        ...((filter.pickupAt || filter.dropoffAt) && {
          bookings: {
            none: conflictingWindow(
              (filter.pickupAt ?? filter.dropoffAt)!,
              (filter.dropoffAt ?? filter.pickupAt)!,
            ),
          },
        }),
        ...(filter.classes?.length && { class: { in: filter.classes } }),
        ...(filter.transmission && { transmission: filter.transmission }),
        ...(filter.minSeats !== undefined && {
          seats: { gte: filter.minSeats },
        }),
      },
      orderBy: { id: "asc" },
      include: { location: true },
    });
    // Filter the effective rate, not the struck-through price, matching quotes.
    return VehicleListSchema.parse(vehicles).filter((vehicle) => {
      const price =
        vehicle.salePricePerDay != null
          ? Math.min(vehicle.pricePerDay, vehicle.salePricePerDay)
          : vehicle.pricePerDay;
      return (
        (filter.minPricePerDay === undefined ||
          price >= filter.minPricePerDay) &&
        (filter.maxPricePerDay === undefined || price <= filter.maxPricePerDay)
      );
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { location: true },
    });
    if (!vehicle) throw new NotFoundException({ message: "Vehicle not found" });
    return VehicleSchema.parse(vehicle);
  }
}
