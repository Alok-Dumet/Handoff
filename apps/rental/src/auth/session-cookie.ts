import { createHash } from "node:crypto";
import type { CookieOptions } from "express";
import { SESSION_COOKIE_NAME } from "@handoff/contracts";

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function sessionToken(cookieHeader?: string): string | undefined {
  const matches = (cookieHeader ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (matches.length !== 1) return undefined;
  const value = matches[0].slice(SESSION_COOKIE_NAME.length + 1);
  return /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions(
  webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000",
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(webOrigin).protocol === "https:",
    path: "/",
    maxAge: SESSION_DURATION_MS,
  };
}
