import { z } from 'zod';

export const ReservationCapabilitySchema = z.object({
  name: z.string().min(1),
  method: z.enum(['GET', 'POST']),
  href: z.string().min(1).startsWith('/'),
});
export type ReservationCapability = z.infer<
  typeof ReservationCapabilitySchema
>;

export const ReservationSummarySchema = z.object({
  domain: z.literal('reservation'),
  description: z.string().min(1),
  capabilities: z.array(ReservationCapabilitySchema).min(1),
});
export type ReservationSummary = z.infer<typeof ReservationSummarySchema>;
