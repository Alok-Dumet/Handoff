import { z } from 'zod';

/**
 * Shared enums for the vehicle bounded context.
 * Schema-first: these Zod schemas are the source of truth; TypeScript
 * types are derived from them via z.infer so the two can never drift.
 */
export const TransmissionSchema = z.enum(['automatic', 'manual']);
export type Transmission = z.infer<typeof TransmissionSchema>;

export const VehicleClassSchema = z.enum([
  'economy',
  'compact',
  'premium',
  'suv',
]);
export type VehicleClass = z.infer<typeof VehicleClassSchema>;

/**
 * Location — a pick-up branch. Its own entity because many vehicles share
 * one location, and it carries data (address) beyond a bare label.
 */
export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
export type Location = z.infer<typeof LocationSchema>;

export const LocationListSchema = z.array(LocationSchema);
export type LocationList = z.infer<typeof LocationListSchema>;

/**
 * Vehicle — the domain shape read by the API's internal inventory module,
 * with the
 * pick-up location resolved (joined) rather than a bare foreign key.
 */
export const VehicleSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  class: VehicleClassSchema,
  transmission: TransmissionSchema,
  seats: z.number().int().positive(),
  pricePerDay: z.number().nonnegative(),
  // When set (and below pricePerDay), the vehicle is on sale: pricePerDay
  // stays the original/struck-through price and this is the discounted one.
  // Nullish because the DB column is nullable and serializes null over JSON.
  salePricePerDay: z.number().nonnegative().nullish(),
  location: LocationSchema,
});
export type Vehicle = z.infer<typeof VehicleSchema>;

/**
 * VehicleCreate — the storage shape used when writing a vehicle (e.g. the
 * seed). Carries the foreign key `locationId` instead of the joined object.
 */
export const VehicleCreateSchema = VehicleSchema.omit({
  location: true,
}).extend({
  locationId: z.string(),
});
export type VehicleCreate = z.infer<typeof VehicleCreateSchema>;

export const VehicleListSchema = z.array(VehicleSchema);
export type VehicleList = z.infer<typeof VehicleListSchema>;

/**
 * VehicleSummary — the BFF-tailored shape for the frontend.
 * The BFF reshapes domain Vehicles into this: ready-to-display title
 * and formatted price, so the web layer stays presentation-only.
 */
export const VehicleSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  class: VehicleClassSchema,
  transmission: TransmissionSchema,
  seats: z.number().int().positive(),
  pricePerDay: z.number().nonnegative(),
  priceLabel: z.string(),
  // Present only when the vehicle is on sale: the original price formatted for
  // a struck-through display next to the discounted priceLabel.
  originalPriceLabel: z.string().optional(),
  pickupLocation: z.string(),
  // Present only when the request supplied a user anchor (lat/lng); the BFF
  // computes it via Haversine. e.g. "12 mi away".
  distanceLabel: z.string().optional(),
});
export type VehicleSummary = z.infer<typeof VehicleSummarySchema>;

export const VehicleSummaryListSchema = z.array(VehicleSummarySchema);
export type VehicleSummaryList = z.infer<typeof VehicleSummaryListSchema>;

/**
 * VehicleDetail — the BFF-tailored shape for the single-vehicle detail page.
 * Like VehicleSummary but carries the pick-up location's full address too,
 * since the detail page surfaces the branch address (the list only needs the
 * name). The BFF reshapes a domain Vehicle into this for GET /vehicles/:id.
 */
export const VehicleDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  class: VehicleClassSchema,
  transmission: TransmissionSchema,
  seats: z.number().int().positive(),
  pricePerDay: z.number().nonnegative(),
  priceLabel: z.string(),
  // Present only when the vehicle is on sale (see VehicleSummary).
  originalPriceLabel: z.string().optional(),
  pickupLocation: z.string(),
  pickupAddress: z.string(),
  // The branch's id, so the purchase page can default the pick-up/drop-off
  // pickers to where the vehicle actually sits.
  pickupLocationId: z.string(),
});
export type VehicleDetail = z.infer<typeof VehicleDetailSchema>;

/**
 * GeocodeResult — a place suggestion for the "near me" location search.
 * The BFF serves these from a curated local list of pick-up anchors, in this
 * minimal, display-ready shape for the Autocomplete.
 */
export const GeocodeResultSchema = z.object({
  label: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;

export const GeocodeResultListSchema = z.array(GeocodeResultSchema);
export type GeocodeResultList = z.infer<typeof GeocodeResultListSchema>;

/**
 * VehicleFilter — the query shape for GET /vehicles. Every field is optional;
 * an empty filter returns everything. Validated on the server,
 * never trusting the client alone. Numerics use z.coerce because query-string
 * params always arrive as strings.
 */
export const VehicleSortSchema = z.enum(['price_asc', 'price_desc', 'distance']);
export type VehicleSort = z.infer<typeof VehicleSortSchema>;

export const VehicleFilterSchema = z.object({
  classes: z.array(VehicleClassSchema).optional(),
  transmission: TransmissionSchema.optional(),
  minSeats: z.coerce.number().int().positive().optional(),
  minPricePerDay: z.coerce.number().nonnegative().optional(),
  maxPricePerDay: z.coerce.number().nonnegative().optional(),
  // User anchor for "nearest" — both required together for distance sorting.
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  sort: VehicleSortSchema.optional(),
});
export type VehicleFilter = z.infer<typeof VehicleFilterSchema>;
