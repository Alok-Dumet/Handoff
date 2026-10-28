import { timingSafeEqual } from "node:crypto";
import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { rentalServiceKey } from "@handoff/contracts";
@Injectable()
export class ServiceGuard implements CanActivate {
  private readonly key = Buffer.from(rentalServiceKey(process.env));
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; path: string }>();
    if (request.method === "GET" && request.path === "/health") return true;
    const header = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, unknown> }>().headers[
      "x-service-key"
    ];
    const supplied = Buffer.from(typeof header === "string" ? header : "");
    if (
      supplied.length !== this.key.length ||
      !timingSafeEqual(supplied, this.key)
    )
      throw new UnauthorizedException();
    return true;
  }
}
