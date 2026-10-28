import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { type GeocodeResult } from "@handoff/contracts";
import { GeocodeService } from "./geocode.service";

@Controller("geocode")
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get()
  search(@Query("q") q?: unknown): GeocodeResult[] {
    if (q !== undefined && typeof q !== "string") {
      throw new BadRequestException("q must be a single search string");
    }
    return this.geocodeService.search(q ?? "");
  }
}
