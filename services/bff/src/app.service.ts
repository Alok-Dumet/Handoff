import { Injectable } from '@nestjs/common';
import { vehicleSchema, type Vehicle } from '@handoff/contracts';

const REFDATA_URL = process.env.REFDATA_URL ?? 'http://localhost:3001';

@Injectable()
export class AppService {
  async getVehicles(): Promise<Vehicle[]> {
    const res = await fetch(`${REFDATA_URL}/vehicles`);
    const data: unknown = await res.json();
    // validate refdata's response against the shared contract (catches drift)
    return vehicleSchema.array().parse(data);
  }
}
