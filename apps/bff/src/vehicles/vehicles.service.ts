import { Injectable } from '@nestjs/common';
import { type VehicleSummary, VehicleListSchema } from '@handoff/contracts';

@Injectable()
export class VehiclesService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? 'http://localhost:3002';

  async findAll(): Promise<VehicleSummary[]> {
    const res = await fetch(`${this.refdataUrl}/vehicles`);
    if (!res.ok) {
      throw new Error(`refdata responded ${res.status}`);
    }

    // Validate the domain response at the boundary: if refdata's shape ever
    // drifts from the contract, we fail loudly here instead of leaking bad
    // data to the frontend.
    const vehicles = VehicleListSchema.parse(await res.json());

    return vehicles.map((v) => ({
      id: v.id,
      title: `${v.year} ${v.make} ${v.model}`,
      class: v.class,
      transmission: v.transmission,
      seats: v.seats,
      pricePerDay: v.pricePerDay,
      priceLabel: `$${v.pricePerDay}/day`,
    }));
  }
}
