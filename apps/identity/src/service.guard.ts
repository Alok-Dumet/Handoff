import { timingSafeEqual } from "node:crypto";
import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { identityServiceKey } from "@handoff/contracts";
@Injectable()
export class ServiceGuard implements CanActivate {
  private readonly key = Buffer.from(identityServiceKey(process.env));
  canActivate(context: ExecutionContext) {
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
