import { Injectable } from '@nestjs/common';
import { type Location, LocationListSchema } from '@handoff/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Branches for the pick-up/drop-off pickers, sorted alphabetically. */
  async findAll(): Promise<Location[]> {
    return LocationListSchema.parse(
      await this.prisma.location.findMany({ orderBy: { name: 'asc' } }),
    );
  }
}
