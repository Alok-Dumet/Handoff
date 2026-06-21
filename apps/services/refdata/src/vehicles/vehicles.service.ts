import { Injectable } from '@nestjs/common';
import { type Vehicle } from '@handoff/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({ orderBy: { id: 'asc' } });
  }
}
