import { Controller, Get, Param } from '@nestjs/common';
import { type Vehicle } from '@handoff/contracts';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(): Promise<Vehicle[]> {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.findOne(id);
  }
}
