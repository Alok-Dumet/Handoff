import { Controller, Get, Query } from '@nestjs/common';
import { type GeocodeResult } from '@handoff/contracts';
import { GeocodeService } from './geocode.service';

@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get()
  search(@Query('q') q?: string): GeocodeResult[] {
    return this.geocodeService.search(q ?? '');
  }
}
