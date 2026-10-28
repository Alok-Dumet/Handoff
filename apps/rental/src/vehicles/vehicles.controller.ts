import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from "@nestjs/common";
import {
  type VehicleDetail,
  type VehicleSummary,
  VehicleFilterSchema,
} from "@handoff/contracts";
import { VehiclesService } from "./vehicles.service";

@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Query() query: Record<string, unknown>): Promise<VehicleSummary[]> {
    // A single `?classes=suv` arrives as a string; repeated keys arrive as an
    // array. Normalize to an array so the schema validates either form.
    if (query.classes !== undefined && !Array.isArray(query.classes)) {
      query.classes = [query.classes];
    }

    const result = VehicleFilterSchema.safeParse(query);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.vehiclesService.findAll(result.data);
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<VehicleDetail> {
    return this.vehiclesService.findOne(id);
  }
}
