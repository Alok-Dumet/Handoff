jest.mock('@handoff/contracts', () => ({
  VehicleListSchema: { parse: (value: unknown) => value },
}));

import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('maps refdata vehicles into UI summaries', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 'veh_001',
            make: 'Toyota',
            model: 'Corolla',
            year: 2024,
            class: 'economy',
            transmission: 'automatic',
            seats: 5,
            pricePerDay: 42,
          },
        ]),
    });

    const service = new VehiclesService();
    const result = await service.findAll();

    expect(result).toEqual([
      {
        id: 'veh_001',
        title: '2024 Toyota Corolla',
        class: 'economy',
        transmission: 'automatic',
        seats: 5,
        pricePerDay: 42,
        priceLabel: '$42/day',
      },
    ]);
  });

  it('throws when refdata responds with an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'refdata down' }),
    });

    const service = new VehiclesService();

    await expect(service.findAll()).rejects.toThrow('refdata responded 500');
  });
});
