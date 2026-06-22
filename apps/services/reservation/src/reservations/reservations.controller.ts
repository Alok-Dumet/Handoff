import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
} from "@nestjs/common";
import {
  type ReservationDetail,
  type ReservationListItem,
  UpdateReservationPaymentStateSchema,
} from "@handoff/contracts";
import { ReservationsService } from "./reservations.service";

@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findAll(): Promise<ReservationListItem[]> {
    return this.reservationsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<ReservationDetail> {
    return this.reservationsService.findOne(id);
  }

  @Put(":id/payment-state")
  updatePaymentState(
    @Param("id") id: string,
    @Body() body: unknown,
  ): Promise<ReservationDetail> {
    const result = UpdateReservationPaymentStateSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.reservationsService.updatePaymentState(id, result.data);
  }
}
