import { z } from 'zod';

export const AuthSessionSchema = z.object({
  authenticated: z.boolean(),
  subject: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  email: z.email().optional(),
  roles: z.array(z.string().min(1)).default([]),
  provider: z.enum(['anonymous', 'clerk']),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
