import { Injectable } from '@nestjs/common';
import { type Location, LocationListSchema } from '@handoff/contracts';
import { toUpstreamException } from '../upstream-exception';

@Injectable()
export class LocationsService {
  private readonly refdataUrl =
    process.env.REFDATA_URL ?? 'http://localhost:3002';

  /**
   * The branch list for the pick-up/drop-off pickers. Passed through as-is —
   * the domain shape is already what the frontend needs — but validated at the
   * boundary so drifting upstream data fails here rather than in the browser.
   */
  async findAll(): Promise<Location[]> {
    const res = await fetch(`${this.refdataUrl}/locations`);
    if (!res.ok) {
      throw await toUpstreamException(res, `refdata responded ${res.status}`);
    }
    return LocationListSchema.parse(await res.json());
  }
}
