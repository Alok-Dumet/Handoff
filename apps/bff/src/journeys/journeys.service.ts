import { Injectable } from '@nestjs/common';
import {
  EReceiptWorkflowSchema,
  IdentityVerificationWorkflowSchema,
  PreCheckInWorkflowSchema,
  ResolveJourneyResponseSchema,
  type EReceiptWorkflow,
  type ReceiptDeliveryPreference,
  type IdentityVerificationStatus,
  type IdentityVerificationWorkflow,
  type JourneyTarget,
  type JourneyType,
  type PreCheckInWorkflow,
  type ResolveJourneyRequest,
  type ResolveJourneyResponse,
  type SubmitPreCheckInWorkflow,
  type UpdateEReceiptDeliveryPreference,
} from '@handoff/contracts';
import { JourneyContentAdapter } from './content/journey-content.adapter';

type ReservationSnapshot = {
  id: string;
  vehicleId: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentState: string;
};

@Injectable()
export class JourneysService {
  private readonly preCheckInWorkflows = new Map<string, PreCheckInWorkflow>();
  private readonly identityWorkflows = new Map<
    string,
    IdentityVerificationWorkflow
  >();
  private readonly eReceiptWorkflows = new Map<string, EReceiptWorkflow>();

  constructor(private readonly contentAdapter: JourneyContentAdapter) {}

  resolve(input: ResolveJourneyRequest): ResolveJourneyResponse {
    const config = this.contentAdapter.getJourneyConfig();
    const journeyType = this.selectJourneyType(input, config.defaultJourney);
    const nextJourney = config.journeys[journeyType];
    const alternatives = this.getAlternatives(nextJourney.type);

    return ResolveJourneyResponseSchema.parse({
      bookingId: input.bookingId,
      nextJourney,
      alternatives,
    });
  }

  getPreCheckIn(reservationId: string): PreCheckInWorkflow {
    const existing = this.preCheckInWorkflows.get(reservationId);

    if (existing) {
      return existing;
    }

    return PreCheckInWorkflowSchema.parse({
      type: 'pre-check-in',
      reservationId,
      status: 'not_started',
      driver: {
        fullName: 'Primary driver',
        email: 'driver@example.com',
        phone: '555-0100',
      },
      pickup: {
        locationName: 'Downtown branch',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
      },
      trip: {},
    });
  }

  submitPreCheckIn(input: SubmitPreCheckInWorkflow): PreCheckInWorkflow {
    const workflow = PreCheckInWorkflowSchema.parse({
      type: 'pre-check-in',
      reservationId: input.reservationId,
      status: 'completed',
      driver: input.driver,
      pickup: input.pickup,
      trip: input.trip,
      completedAt: new Date().toISOString(),
    });

    this.preCheckInWorkflows.set(input.reservationId, workflow);

    return workflow;
  }

  getIdentityVerification(reservationId: string): IdentityVerificationWorkflow {
    const existing = this.identityWorkflows.get(reservationId);

    if (existing) {
      return existing;
    }

    return this.createIdentityWorkflow({
      reservationId,
      status: 'not_started',
      message:
        'Identity verification has not started. Start the provider handoff when the driver is ready.',
    });
  }

  startIdentityVerification(
    reservationId: string,
  ): IdentityVerificationWorkflow {
    const providerReference = `idv_mock_${reservationId}`;
    const workflow = this.createIdentityWorkflow({
      reservationId,
      status: 'handoff_created',
      providerReference,
      handoffUrl: `https://identity.local/handoff/${encodeURIComponent(providerReference)}`,
      message:
        'Provider handoff created. Continue to the provider-style check, then return to refresh status.',
    });

    this.identityWorkflows.set(reservationId, workflow);

    return workflow;
  }

  updateIdentityVerificationStatus(
    reservationId: string,
    status: Exclude<IdentityVerificationStatus, 'not_started'>,
  ): IdentityVerificationWorkflow {
    const current = this.getIdentityVerification(reservationId);
    const workflow = this.createIdentityWorkflow({
      reservationId,
      status,
      providerReference:
        current.providerReference ?? `idv_mock_${reservationId}`,
      handoffUrl: current.handoffUrl,
      message: getIdentityStatusMessage(status),
    });

    this.identityWorkflows.set(reservationId, workflow);

    return workflow;
  }

  async getEReceipt(reservationId: string): Promise<EReceiptWorkflow> {
    const existing = this.eReceiptWorkflows.get(reservationId);

    if (existing) {
      return existing;
    }

    const reservation = await this.getReservation(reservationId);
    const receipt = await this.createEReceipt(reservation, 'email');
    this.eReceiptWorkflows.set(reservationId, receipt);
    return receipt;
  }

  async updateEReceiptDeliveryPreference(
    input: UpdateEReceiptDeliveryPreference,
  ): Promise<EReceiptWorkflow> {
    const reservation = await this.getReservation(input.reservationId);
    const workflow = await this.createEReceipt(
      reservation,
      input.deliveryPreference,
    );
    this.eReceiptWorkflows.set(input.reservationId, workflow);

    return workflow;
  }

  private selectJourneyType(
    input: ResolveJourneyRequest,
    defaultJourney: JourneyType,
  ): JourneyType {
    if (input.bookingStatus !== 'pending' && input.signals.receiptAvailable) {
      return 'e-receipt';
    }

    if (input.signals.biometricEligible) {
      return 'biometric';
    }

    if (input.signals.upgradeAvailable) {
      return 'vehicle-upgrade';
    }

    if (input.signals.checkedInEligible) {
      return 'pre-check-in';
    }

    return defaultJourney;
  }

  private getAlternatives(selectedType: JourneyType): JourneyTarget[] {
    const config = this.contentAdapter.getJourneyConfig();

    return Object.values(config.journeys).filter(
      (journey) => journey.type !== selectedType,
    );
  }

  private createIdentityWorkflow(input: {
    reservationId: string;
    status: IdentityVerificationStatus;
    message: string;
    providerReference?: string;
    handoffUrl?: string;
  }): IdentityVerificationWorkflow {
    return IdentityVerificationWorkflowSchema.parse({
      type: 'biometric',
      reservationId: input.reservationId,
      status: input.status,
      provider: 'mock-identity-provider',
      providerReference: input.providerReference,
      handoffUrl: input.handoffUrl,
      message: input.message,
      updatedAt: new Date().toISOString(),
    });
  }

  private async getReservation(reservationId: string): Promise<{
    id: string;
    vehicleId: string;
    customerName: string;
    customerEmail: string;
    startDate: string;
    endDate: string;
    status: string;
    paymentState: string;
  }> {
    const reservationServiceUrl =
      process.env.RESERVATION_SERVICE_URL ?? 'http://localhost:3004';
    const res = await fetch(
      `${reservationServiceUrl}/reservations/${encodeURIComponent(reservationId)}`,
    );

    if (!res.ok) {
      throw new Error(`reservation service responded ${res.status}`);
    }

    return (await res.json()) as ReservationSnapshot;
  }

  private async createEReceipt(
    reservation: ReservationSnapshot,
    deliveryPreference: ReceiptDeliveryPreference = 'email',
  ): Promise<EReceiptWorkflow> {
    const vehicle = await this.getVehicle(reservation.vehicleId);
    const rentalDays = calculateRentalDays(
      reservation.startDate,
      reservation.endDate,
    );
    const baseAmount = vehicle.pricePerDay * rentalDays * 100;
    const taxes = Math.round(baseAmount * 0.12);
    const subtotalCents = baseAmount;
    const totalCents = subtotalCents + taxes;
    const lineItems = [
      {
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        amountCents: subtotalCents,
      },
      {
        label: 'Taxes and fees',
        amountCents: taxes,
      },
    ];

    return EReceiptWorkflowSchema.parse({
      type: 'e-receipt',
      reservationId: reservation.id,
      status: deliveryPreference === 'download' ? 'ready' : 'sent',
      deliveryPreference,
      deliveryEmail: reservation.customerEmail,
      receiptNumber: `rcpt_${reservation.id}`,
      lineItems,
      subtotalCents,
      taxCents: taxes,
      totalCents,
      updatedAt: new Date().toISOString(),
      sentAt:
        deliveryPreference === 'email' ? new Date().toISOString() : undefined,
      message:
        deliveryPreference === 'email'
          ? `Receipt sent to ${reservation.customerEmail}.`
          : 'Receipt ready for download.',
    });
  }

  private async getVehicle(vehicleId: string): Promise<{
    id: string;
    make: string;
    model: string;
    year: number;
    pricePerDay: number;
  }> {
    const refdataUrl = process.env.REFDATA_URL ?? 'http://localhost:3002';
    const res = await fetch(`${refdataUrl}/vehicles`);

    if (!res.ok) {
      throw new Error(`refdata responded ${res.status}`);
    }

    const vehicles = (await res.json()) as Array<{
      id: string;
      make: string;
      model: string;
      year: number;
      pricePerDay: number;
    }>;
    const vehicle = vehicles.find((item) => item.id === vehicleId);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return vehicle;
  }
}

function getIdentityStatusMessage(
  status: Exclude<IdentityVerificationStatus, 'not_started'>,
): string {
  if (status === 'handoff_created') {
    return 'Provider handoff is ready for the driver.';
  }

  if (status === 'pending_review') {
    return 'Identity evidence was submitted and is pending provider review.';
  }

  if (status === 'verified') {
    return 'Identity verification is complete for this reservation.';
  }

  return 'Identity verification failed. The driver should retry or complete manual review at pickup.';
}

function calculateRentalDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(1, Math.ceil((end - start) / millisecondsPerDay));
}
