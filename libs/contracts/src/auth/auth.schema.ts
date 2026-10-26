import { z } from 'zod';

export const SESSION_COOKIE_NAME = 'handoff_session';
export const AccountUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});
export type AccountUser = z.infer<typeof AccountUserSchema>;

const EmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
const PasswordSchema = z.string().min(8, 'Use at least 8 characters').max(128);

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: EmailSchema,
  password: PasswordSchema,
});
export type Register = z.infer<typeof RegisterSchema>;
export const LoginSchema = z.object({ email: EmailSchema, password: PasswordSchema });
export type Login = z.infer<typeof LoginSchema>;
export const SessionResponseSchema = z.object({ user: AccountUserSchema.nullable() });
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
