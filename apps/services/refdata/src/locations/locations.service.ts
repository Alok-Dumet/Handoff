import { Injectable } from '@nestjs/common';
import { type Location } from '@handoff/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All branches, alphabetical — this is what the pick-up/drop-off pickers list. */
  findAll(): Promise<Location[]> {
    return this.prisma.location.findMany({ orderBy: { name: 'asc' } });
  }
}
