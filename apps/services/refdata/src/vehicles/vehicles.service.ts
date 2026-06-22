import { Injectable, NotFoundException } from '@nestjs/common';
import { type Vehicle } from '@handoff/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException({ message: 'Vehicle not found' });
    }

    return vehicle;
  }
}
