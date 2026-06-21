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
 * Vehicle — the domain shape owned by the refdata service.
 * This is what refdata stores and returns from GET /vehicles.
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
});
export type Vehicle = z.infer<typeof VehicleSchema>;

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
});
export type VehicleSummary = z.infer<typeof VehicleSummarySchema>;

export const VehicleSummaryListSchema = z.array(VehicleSummarySchema);
export type VehicleSummaryList = z.infer<typeof VehicleSummaryListSchema>;
