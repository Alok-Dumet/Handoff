import { cookies } from "next/headers";
import { cache } from "react";
import {
  SESSION_COOKIE_NAME,
  SessionResponseSchema,
  type AccountUser,
} from "@handoff/contracts";

// React cache deduplicates layout/page lookups within this render, not across users.
export const getCurrentUser = cache(async (): Promise<AccountUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const response = await fetch(
      `${process.env.BFF_URL ?? "http://localhost:3001"}/auth/session`,
      {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return null;
    return SessionResponseSchema.parse(await response.json()).user;
  } catch {
    return null;
  }
});
