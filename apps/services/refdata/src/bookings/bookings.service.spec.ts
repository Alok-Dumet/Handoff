jest.mock('@handoff/contracts', () => ({
  BookingSchema: { parse: (value: unknown) => value },
  BookingListSchema: { parse: (value: unknown) => value },
}));
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

type CreateBookingArgs = {
  data: {
    id: string;
    vehicleId: string;
    customerName: string;
    customerEmail: string;
    startDate: Date;
    endDate: Date;
  };
};

type MockPrisma = {
  vehicle: {
    findUnique: jest.Mock;
  };
  booking: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('BookingsService', () => {
  const prisma: MockPrisma = {
    vehicle: {
      findUnique: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a pending booking for an existing vehicle', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'veh_001' });
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.booking.create.mockResolvedValue({
      id: 'booking_123',
      vehicleId: 'veh_001',
      customerName: 'Demo Customer',
      customerEmail: 'demo@example.com',
      startDate: new Date('2026-06-21T00:00:00.000Z'),
      endDate: new Date('2026-06-22T00:00:00.000Z'),
      status: 'pending',
      createdAt: new Date('2026-06-21T12:00:00.000Z'),
    });

    const service = new BookingsService(prisma as never);
    const booking = await service.create({
      vehicleId: 'veh_001',
      customerName: 'Demo Customer',
      customerEmail: 'demo@example.com',
      startDate: '2026-06-21',
      endDate: '2026-06-22',
    });

    const createCalls = prisma.booking.create.mock.calls as unknown as Array<
      [CreateBookingArgs]
    >;
    const createArgs = createCalls[0]?.[0];
    expect(createArgs).toBeDefined();
    expect(createArgs.data).toEqual(
      expect.objectContaining({
        vehicleId: 'veh_001',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: new Date('2026-06-21'),
        endDate: new Date('2026-06-22'),
      }),
    );
    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        vehicleId: 'veh_001',
        status: { in: ['pending', 'confirmed'] },
        startDate: { lt: new Date('2026-06-22') },
        endDate: { gt: new Date('2026-06-21') },
      },
      select: { id: true },
    });
    expect(booking).toEqual(
      expect.objectContaining({
        vehicleId: 'veh_001',
        status: 'pending',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
      }),
    );
  });

  it('returns recent bookings newest first', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking_123',
        vehicleId: 'veh_001',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: new Date('2026-06-21T00:00:00.000Z'),
        endDate: new Date('2026-06-22T00:00:00.000Z'),
        status: 'pending',
        createdAt: new Date('2026-06-21T12:00:00.000Z'),
      },
    ]);

    const service = new BookingsService(prisma as never);
    const bookings = await service.findAll();

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    expect(bookings).toHaveLength(1);
    expect(bookings[0]?.createdAt).toBe('2026-06-21T12:00:00.000Z');
  });

  it('rejects bookings for missing vehicles', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    const service = new BookingsService(prisma as never);

    await expect(
      service.create({
        vehicleId: 'missing',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects overlapping bookings for the same vehicle', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'veh_001' });
    prisma.booking.findFirst.mockResolvedValue({ id: 'booking_existing' });

    const service = new BookingsService(prisma as never);

    await expect(
      service.create({
        vehicleId: 'veh_001',
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        startDate: '2026-06-21',
        endDate: '2026-06-22',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });
});
