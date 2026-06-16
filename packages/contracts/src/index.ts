import { z } from "zod";

export const vehicleSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  category: z.enum(["economy", "compact", "suv", "luxury", "van"]),
  pricePerDay: z.number().int().nonnegative(), // cents
  currency: z.string().length(3),              // ISO 4217
  seats: z.number().int().positive(),
  location: z.string(),
  available: z.boolean(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;
