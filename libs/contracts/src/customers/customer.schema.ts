import { z } from 'zod';

export const CustomerProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  loyaltyTier: z.enum(['standard', 'gold', 'platinum']),
  preferredBrand: z.enum(['handoff']),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;
