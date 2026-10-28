import { z } from "zod";
import {
  AccountUserSchema,
  LoginSchema,
  RegisterSchema,
} from "../auth/index.js";
const token = z.string().regex(/^[a-f0-9]{64}$/);
export const IdentityTokenSchema = z
  .object({ token: token.optional() })
  .strict();
export const IdentityLoginSchema = IdentityTokenSchema.extend({
  input: LoginSchema,
});
export const IdentityRegisterSchema = IdentityTokenSchema.extend({
  input: RegisterSchema,
});
export const IdentityLoginResultSchema = z.object({
  user: AccountUserSchema,
  token,
});
export function identityServiceKey(
  env: Record<string, string | undefined>,
): string {
  if (env.IDENTITY_SERVICE_KEY) return env.IDENTITY_SERVICE_KEY;
  if (env.NODE_ENV === "production")
    throw new Error("IDENTITY_SERVICE_KEY is required");
  return "handoff-local-identity-key";
}
