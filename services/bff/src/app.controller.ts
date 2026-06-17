import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { Vehicle } from '@handoff/contracts';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('vehicles')
  getVehicles(): Promise<Vehicle[]> {
    return this.appService.getVehicles();
  }
}
