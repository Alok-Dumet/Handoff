import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EReceiptWorkflowSchema,
  IdentityVerificationWorkflowSchema,
  PreCheckInWorkflowSchema,
  ResolveJourneyResponseSchema,
  VehicleListSchema,
  VehicleSchema,
  VehicleUpgradeWorkflowSchema,
  type EReceiptWorkflow,
  type ReceiptDeliveryPreference,
  type IdentityVerificationStatus,
  type IdentityVerificationWorkflow,
  type JourneyTarget,
  type JourneyType,
  type PreCheckInWorkflow,
  type ResolveJourneyRequest,
  type ResolveJourneyResponse,
  type SelectVehicleUpgradeWorkflow,
  type SubmitPreCheckInWorkflow,
  type UpdateEReceiptDeliveryPreference,
  type VehicleUpgradeWorkflow,
} from '@handoff/contracts';
import { toUpstreamException } from '../upstream-exception';
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
  private readonly vehicleUpgradeWorkflows = new Map<
    string,
    VehicleUpgradeWorkflow
  >();

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

  async getVehicleUpgrade(
    reservationId: string,
  ): Promise<VehicleUpgradeWorkflow> {
    const existing = this.vehicleUpgradeWorkflows.get(reservationId);

    if (existing) {
      return existing;
    }

    const workflow = await this.createVehicleUpgradeWorkflow(reservationId);
    this.vehicleUpgradeWorkflows.set(reservationId, workflow);
    return workflow;
  }

  async selectVehicleUpgrade(
    input: SelectVehicleUpgradeWorkflow,
  ): Promise<VehicleUpgradeWorkflow> {
    const workflow = await this.getVehicleUpgrade(input.reservationId);
    const selectedOffer = workflow.offers.find(
      (offer) => offer.vehicleId === input.vehicleId,
    );

    if (!selectedOffer) {
      throw new NotFoundException({
        message: 'Vehicle upgrade offer not found',
      });
    }

    const updated = VehicleUpgradeWorkflowSchema.parse({
      ...workflow,
      status: 'reviewing',
      selectedVehicleId: selectedOffer.vehicleId,
      selectedOffer,
      updatedAt: new Date().toISOString(),
      message: `Selected ${selectedOffer.title}. Review the upgrade and confirm when ready.`,
    });

    this.vehicleUpgradeWorkflows.set(input.reservationId, updated);
    return updated;
  }

  async confirmVehicleUpgrade(
    reservationId: string,
  ): Promise<VehicleUpgradeWorkflow> {
    const workflow = await this.getVehicleUpgrade(reservationId);

    if (!workflow.selectedOffer) {
      throw new BadRequestException({
        message: 'Select an upgrade before confirming it',
      });
    }

    const confirmed = VehicleUpgradeWorkflowSchema.parse({
      ...workflow,
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: `Upgrade confirmed for ${workflow.selectedOffer.title}.`,
    });

    this.vehicleUpgradeWorkflows.set(reservationId, confirmed);
    return confirmed;
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
      throw await toUpstreamException(
        res,
        `reservation service responded ${res.status}`,
      );
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
    const res = await fetch(
      `${refdataUrl}/vehicles/${encodeURIComponent(vehicleId)}`,
    );

    if (!res.ok) {
      throw await toUpstreamException(res, `refdata responded ${res.status}`);
    }

    return VehicleSchema.parse(await res.json());
  }

  private async createVehicleUpgradeWorkflow(
    reservationId: string,
  ): Promise<VehicleUpgradeWorkflow> {
    const reservation = await this.getReservation(reservationId);
    const vehicles = await this.getVehicles();
    const currentVehicle = this.toUpgradeOffer(
      vehicles.find((vehicle) => vehicle.id === reservation.vehicleId),
    );

    if (!currentVehicle) {
      throw new NotFoundException({ message: 'Current vehicle not found' });
    }

    const offers = vehicles
      .filter((vehicle) => vehicle.id !== currentVehicle.vehicleId)
      .map((vehicle) =>
        this.toUpgradeOffer(vehicle, currentVehicle.pricePerDay),
      )
      .filter((offer): offer is NonNullable<typeof offer> =>
        Boolean(offer && isUpgradeEligible(currentVehicle, offer)),
      )
      .sort((left, right) => left.pricePerDay - right.pricePerDay)
      .slice(0, 3);

    if (offers.length === 0) {
      offers.push({
        vehicleId: currentVehicle.vehicleId,
        title: currentVehicle.title,
        class: currentVehicle.class,
        transmission: currentVehicle.transmission,
        seats: currentVehicle.seats,
        pricePerDay: currentVehicle.pricePerDay,
        priceLabel: currentVehicle.priceLabel,
        deltaPerDayCents: 0,
        deltaLabel: 'No upgrade offers available',
      });
    }

    return VehicleUpgradeWorkflowSchema.parse({
      type: 'vehicle-upgrade',
      reservationId,
      status: 'not_started',
      currentVehicle,
      offers,
      updatedAt: new Date().toISOString(),
      message: `Review upgrade options for reservation ${reservationId}.`,
    });
  }

  private async getVehicles(): Promise<
    Array<{
      id: string;
      make: string;
      model: string;
      year: number;
      class: string;
      transmission: string;
      seats: number;
      pricePerDay: number;
    }>
  > {
    const refdataUrl = process.env.REFDATA_URL ?? 'http://localhost:3002';
    const res = await fetch(`${refdataUrl}/vehicles`);

    if (!res.ok) {
      throw await toUpstreamException(res, `refdata responded ${res.status}`);
    }

    return VehicleListSchema.parse(await res.json());
  }

  private toUpgradeOffer(
    vehicle:
      | {
          id: string;
          make: string;
          model: string;
          year: number;
          class: string;
          transmission: string;
          seats: number;
          pricePerDay: number;
        }
      | undefined,
    basePricePerDay?: number,
  ) {
    if (!vehicle) {
      return undefined;
    }

    const pricePerDay = vehicle.pricePerDay;
    const currentPricePerDay = basePricePerDay ?? pricePerDay;
    const deltaPerDayCents = Math.round(
      (pricePerDay - currentPricePerDay) * 100,
    );

    return {
      vehicleId: vehicle.id,
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      class: vehicle.class,
      transmission: vehicle.transmission,
      seats: vehicle.seats,
      pricePerDay,
      priceLabel: formatPricePerDay(pricePerDay),
      deltaPerDayCents,
      deltaLabel: formatDeltaLabel(deltaPerDayCents),
    };
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

function isUpgradeEligible(
  currentVehicle: {
    class: string;
    pricePerDay: number;
  },
  offer: {
    class: string;
    pricePerDay: number;
  },
) {
  const classes = ['economy', 'compact', 'premium', 'suv'];
  const currentRank = classes.indexOf(currentVehicle.class);
  const offerRank = classes.indexOf(offer.class);

  if (currentRank >= 0 && offerRank >= 0) {
    return offerRank > currentRank;
  }

  return offer.pricePerDay > currentVehicle.pricePerDay;
}

function formatPricePerDay(pricePerDay: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(pricePerDay);
}

function formatDeltaLabel(deltaPerDayCents: number) {
  if (deltaPerDayCents === 0) {
    return 'Included in current rate';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(deltaPerDayCents) / 100);

  return deltaPerDayCents > 0
    ? `+${formatted} per day`
    : `-${formatted} per day`;
}
