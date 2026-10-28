import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import {
  type Quote,
  QuoteRequestSchema,
  RentalWindowSchema,
} from "@handoff/contracts";
import { PricingService } from "./pricing.service";

@Controller("quote")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  quote(@Query() query: Record<string, unknown>): Promise<Quote> {
    // A single `?addOnIds=x` arrives as a string; repeated keys as an array.
    if (query.addOnIds !== undefined && !Array.isArray(query.addOnIds)) {
      query.addOnIds = [query.addOnIds];
    }

    const parsed = QuoteRequestSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    // Re-check the window's duration rules server-side. The shape check above
    // only proves the timestamps are well-formed; this proves the rental is
    // legal. Never price a window the booking endpoint would refuse.
    const window = RentalWindowSchema.safeParse({
      pickupLocationId: "unused",
      dropoffLocationId: "unused",
      pickupAt: parsed.data.pickupAt,
      dropoffAt: parsed.data.dropoffAt,
    });
    if (!window.success) {
      throw new BadRequestException(window.error.issues);
    }

    return this.pricingService.quote(parsed.data);
  }
}
