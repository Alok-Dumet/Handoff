import {
  type GeocodeResult,
  type Location,
  type Quote,
  type QuoteRequest,
  type VehicleDetail,
  type VehicleFilter,
  type VehicleSummary,
  GeocodeResultListSchema,
  LocationListSchema,
  QuoteSchema,
  VehicleDetailSchema,
  VehicleSummaryListSchema,
} from "@handoff/contracts";

// Server-side fetches (Server Components) use the internal BFF URL.
const BFF_URL = process.env.BFF_URL ?? "http://localhost:3001";
// Browser fetches (autocomplete typeahead) need a publicly reachable URL.
const PUBLIC_BFF_URL =
  process.env.NEXT_PUBLIC_BFF_URL ?? "http://localhost:3001";

/** Turn a VehicleFilter into BFF query params (omitting empty fields). */
function filterToParams(filter: VehicleFilter): URLSearchParams {
  const params = new URLSearchParams();
  filter.classes?.forEach((c) => params.append("classes", c));
  if (filter.transmission) params.set("transmission", filter.transmission);
  if (filter.minSeats !== undefined)
    params.set("minSeats", String(filter.minSeats));
  if (filter.minPricePerDay !== undefined)
    params.set("minPricePerDay", String(filter.minPricePerDay));
  if (filter.maxPricePerDay !== undefined)
    params.set("maxPricePerDay", String(filter.maxPricePerDay));
  if (filter.lat !== undefined) params.set("lat", String(filter.lat));
  if (filter.lng !== undefined) params.set("lng", String(filter.lng));
  if (filter.sort) params.set("sort", filter.sort);
  return params;
}

/**
 * Fetch the display-ready vehicle list from the BFF, applying the given
 * filter. Validated against the shared contract so a drifting upstream fails
 * here rather than rendering bad data. `no-store` keeps results live.
 */
export async function getVehicles(
  filter: VehicleFilter = {},
): Promise<VehicleSummary[]> {
  const qs = filterToParams(filter).toString();
  const res = await fetch(`${BFF_URL}/vehicles${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`BFF responded ${res.status}`);
  }
  return VehicleSummaryListSchema.parse(await res.json());
}

/**
 * Fetch a single vehicle's detail shape from the BFF. Returns null on 404 so
 * the page can render Next's notFound(); other non-OK responses throw.
 * Validated against the shared contract, same as the list fetch.
 */
export async function getVehicle(id: string): Promise<VehicleDetail | null> {
  const res = await fetch(`${BFF_URL}/vehicles/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`BFF responded ${res.status}`);
  }
  return VehicleDetailSchema.parse(await res.json());
}

/**
 * Fetch the branch list from the BFF — the options for the pick-up and
 * drop-off pickers on the purchase page. Server-side only; the list changes
 * rarely, so it is cached briefly rather than fetched per render.
 */
export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${BFF_URL}/locations`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`BFF responded ${res.status}`);
  }
  return LocationListSchema.parse(await res.json());
}

/**
 * Ask the BFF to price a rental. The BFF owns this arithmetic — we render
 * what it returns and never compute a total here, so what the customer sees
 * is what the server would charge.
 *
 * Returns null when the window is rejected (400), which the page shows as an
 * un-priced summary rather than an error screen; the user is mid-form.
 */
export async function getQuote(request: QuoteRequest): Promise<Quote | null> {
  const params = new URLSearchParams({
    vehicleId: request.vehicleId,
    pickupAt: request.pickupAt,
    dropoffAt: request.dropoffAt,
  });
  request.addOnIds.forEach((id) => params.append("addOnIds", id));
  if (request.protectionPlanId) {
    params.set("protectionPlanId", request.protectionPlanId);
  }

  const res = await fetch(`${BFF_URL}/quote?${params.toString()}`, {
    cache: "no-store",
  });
  if (res.status === 400 || res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`BFF responded ${res.status}`);
  }
  return QuoteSchema.parse(await res.json());
}

/**
 * Look up a US pick-up place via the BFF, which matches against a curated
 * local list. Called from the browser as the user types in the location
 * Autocomplete.
 */
export async function geocode(query: string): Promise<GeocodeResult[]> {
  const res = await fetch(
    `${PUBLIC_BFF_URL}/geocode?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) {
    return [];
  }
  return GeocodeResultListSchema.parse(await res.json());
}
