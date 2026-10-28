import { Injectable } from "@nestjs/common";
import {
  type GeocodeResult,
  GeocodeResultListSchema,
} from "@handoff/contracts";
import locationsData from "./locations.json";

// Curated list of common US pick-up anchors (airports + downtowns). Validated
// once at module load so a malformed file fails loudly here rather than
// leaking bad coordinates into distance sorting.
const LOCATIONS: GeocodeResult[] = GeocodeResultListSchema.parse(locationsData);

const MAX_RESULTS = 5;

@Injectable()
export class GeocodeService {
  // Local substring search over a fixed location list — no external geocoding
  // provider, so results are instant and deterministic. The app only ever
  // needs to anchor on a known set of pick-up points.
  search(query: string): GeocodeResult[] {
    const q = query.trim().toLowerCase();
    if (q.length < 3) {
      return [];
    }

    return LOCATIONS.filter((loc) => loc.label.toLowerCase().includes(q)).slice(
      0,
      MAX_RESULTS,
    );
  }
}
