import { z } from 'zod';

export const AuthSessionSchema = z.object({
  authenticated: z.boolean(),
  subject: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  roles: z.array(z.string().min(1)).default([]),
  provider: z.literal('demo-auth'),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
