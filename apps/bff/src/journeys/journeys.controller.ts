import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  IdentityVerificationWorkflowSchema,
  ConfirmVehicleUpgradeWorkflowSchema,
  PreCheckInWorkflowSchema,
  ResolveJourneyRequestSchema,
  SelectVehicleUpgradeWorkflowSchema,
  UpdateEReceiptDeliveryPreferenceSchema,
  StartIdentityVerificationWorkflowSchema,
  SubmitPreCheckInWorkflowSchema,
  UpdateIdentityVerificationStatusSchema,
  type EReceiptWorkflow,
  type IdentityVerificationWorkflow,
  type PreCheckInWorkflow,
  type ResolveJourneyResponse,
  type VehicleUpgradeWorkflow,
} from '@handoff/contracts';
import { JourneysService } from './journeys.service';

@Controller('journeys')
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  @Post('resolve')
  resolve(@Body() body: unknown): ResolveJourneyResponse {
    const result = ResolveJourneyRequestSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.journeysService.resolve(result.data);
  }

  @Get('pre-check-in/:reservationId')
  getPreCheckIn(
    @Param('reservationId') reservationId: string,
  ): PreCheckInWorkflow {
    return this.journeysService.getPreCheckIn(reservationId);
  }

  @Post('pre-check-in')
  submitPreCheckIn(@Body() body: unknown): PreCheckInWorkflow {
    const result = SubmitPreCheckInWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return PreCheckInWorkflowSchema.parse(
      this.journeysService.submitPreCheckIn(result.data),
    );
  }

  @Get('identity-verification/:reservationId')
  getIdentityVerification(
    @Param('reservationId') reservationId: string,
  ): IdentityVerificationWorkflow {
    return this.journeysService.getIdentityVerification(reservationId);
  }

  @Post('identity-verification/start')
  startIdentityVerification(
    @Body() body: unknown,
  ): IdentityVerificationWorkflow {
    const result = StartIdentityVerificationWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return IdentityVerificationWorkflowSchema.parse(
      this.journeysService.startIdentityVerification(result.data.reservationId),
    );
  }

  @Post('identity-verification/status')
  updateIdentityVerificationStatus(
    @Body() body: unknown,
  ): IdentityVerificationWorkflow {
    const result = UpdateIdentityVerificationStatusSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return IdentityVerificationWorkflowSchema.parse(
      this.journeysService.updateIdentityVerificationStatus(
        result.data.reservationId,
        result.data.status,
      ),
    );
  }

  @Get('e-receipt/:reservationId')
  getEReceipt(
    @Param('reservationId') reservationId: string,
  ): Promise<EReceiptWorkflow> {
    return this.journeysService.getEReceipt(reservationId);
  }

  @Post('e-receipt/delivery-preference')
  updateEReceiptDeliveryPreference(
    @Body() body: unknown,
  ): Promise<EReceiptWorkflow> {
    const result = UpdateEReceiptDeliveryPreferenceSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.journeysService.updateEReceiptDeliveryPreference(result.data);
  }

  @Get('vehicle-upgrade/:reservationId')
  getVehicleUpgrade(
    @Param('reservationId') reservationId: string,
  ): Promise<VehicleUpgradeWorkflow> {
    return this.journeysService.getVehicleUpgrade(reservationId);
  }

  @Post('vehicle-upgrade/select')
  selectVehicleUpgrade(@Body() body: unknown): Promise<VehicleUpgradeWorkflow> {
    const result = SelectVehicleUpgradeWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.journeysService.selectVehicleUpgrade(result.data);
  }

  @Post('vehicle-upgrade/confirm')
  confirmVehicleUpgrade(
    @Body() body: unknown,
  ): Promise<VehicleUpgradeWorkflow> {
    const result = ConfirmVehicleUpgradeWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.journeysService.confirmVehicleUpgrade(
      result.data.reservationId,
    );
  }
}
