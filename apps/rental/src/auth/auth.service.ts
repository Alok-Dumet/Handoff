import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  identityServiceKey,
  SessionResponseSchema,
  type AccountUser,
} from "@handoff/contracts";
@Injectable()
export class AuthService {
  private readonly origin = process.env.IDENTITY_URL ?? "http://127.0.0.1:3003";
  private readonly key = identityServiceKey(process.env);
  async currentUser(token?: string): Promise<AccountUser | null> {
    if (!token) return null;
    try {
      const response = await fetch(
        new URL("/internal/auth/session", this.origin),
        {
          method: "POST",
          signal: AbortSignal.timeout(5000),
          headers: {
            "Content-Type": "application/json",
            "X-Service-Key": this.key,
          },
          body: JSON.stringify({ token }),
        },
      );
      if (!response.ok) throw new Error("Identity unavailable");
      return SessionResponseSchema.parse(await response.json()).user;
    } catch {
      throw new ServiceUnavailableException(
        "Account service unavailable. Please try again.",
      );
    }
  }
}
