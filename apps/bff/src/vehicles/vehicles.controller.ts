import { Controller, Get } from '@nestjs/common';
import { type VehicleSummary } from '@handoff/contracts';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(): Promise<VehicleSummary[]> {
    return this.vehiclesService.findAll();
  }
}
