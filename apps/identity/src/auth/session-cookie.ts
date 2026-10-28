import { createHash } from "node:crypto";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
