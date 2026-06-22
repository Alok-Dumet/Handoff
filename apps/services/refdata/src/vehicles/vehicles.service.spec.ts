jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

type MockPrisma = {
  vehicle: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
};

describe('VehiclesService', () => {
  const prisma: MockPrisma = {
    vehicle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns vehicles ordered by id', async () => {
    prisma.vehicle.findMany.mockResolvedValue([vehicle]);

    const service = new VehiclesService(prisma as never);
    const vehicles = await service.findAll();

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    });
    expect(vehicles).toEqual([vehicle]);
  });

  it('returns a single vehicle by id', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(vehicle);

    const service = new VehiclesService(prisma as never);
    const result = await service.findOne('veh_001');

    expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
      where: { id: 'veh_001' },
    });
    expect(result).toEqual(vehicle);
  });

  it('throws not found when a vehicle id is missing', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    const service = new VehiclesService(prisma as never);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

const vehicle = {
  id: 'veh_001',
  make: 'Toyota',
  model: 'Corolla',
  year: 2024,
  class: 'economy',
  transmission: 'automatic',
  seats: 5,
  pricePerDay: 42,
};
