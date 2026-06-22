import {
  BookingJourneyResponseSchema,
  BookingListSchema,
  CreateBookingSchema,
  CreateReservationPaymentSessionSchema,
  IdentityVerificationWorkflowSchema,
  PreCheckInWorkflowSchema,
  ReservationDetailSchema,
  ReservationListSchema,
  ReservationPaymentSessionSchema,
  SubmitPreCheckInWorkflowSchema,
  StartIdentityVerificationWorkflowSchema,
  UpdateIdentityVerificationStatusSchema,
  type Booking,
  type BookingJourneyResponse,
  type CreateBooking,
  type CreateReservationPaymentSession,
  type IdentityVerificationWorkflow,
  type PreCheckInWorkflow,
  type ReservationDetail,
  type ReservationListItem,
  type ReservationPaymentSession,
  type StartIdentityVerificationWorkflow,
  type SubmitPreCheckInWorkflow,
  type UpdateIdentityVerificationStatus,
} from "@handoff/contracts";

function getPublicBffUrl() {
  return process.env.NEXT_PUBLIC_BFF_URL ?? "http://localhost:3001";
}

export class BffRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class BookingRequestError extends BffRequestError {}

export async function createBooking(
  input: CreateBooking,
): Promise<BookingJourneyResponse> {
  const payload = CreateBookingSchema.parse(input);

  const res = await fetch(`${getPublicBffUrl()}/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new BookingRequestError(`Booking failed with ${res.status}`, res.status);
  }

  return BookingJourneyResponseSchema.parse(await res.json());
}

export async function getBookings(): Promise<Booking[]> {
  const res = await fetch(`${getPublicBffUrl()}/bookings`);

  if (!res.ok) {
    throw new BffRequestError(`Bookings failed with ${res.status}`, res.status);
  }

  return BookingListSchema.parse(await res.json());
}

export async function getReservations(): Promise<ReservationListItem[]> {
  const res = await fetch(`${getPublicBffUrl()}/reservations`);

  if (!res.ok) {
    throw new BffRequestError(`Reservations failed with ${res.status}`, res.status);
  }

  return ReservationListSchema.parse(await res.json());
}

export async function getReservation(id: string): Promise<ReservationDetail> {
  const res = await fetch(
    `${getPublicBffUrl()}/reservations/${encodeURIComponent(id)}`,
  );

  if (!res.ok) {
    throw new BffRequestError(`Reservation failed with ${res.status}`, res.status);
  }

  return ReservationDetailSchema.parse(await res.json());
}

export async function createReservationPaymentSession(
  input: CreateReservationPaymentSession,
): Promise<ReservationPaymentSession> {
  const payload = CreateReservationPaymentSessionSchema.parse(input);

  const res = await fetch(`${getPublicBffUrl()}/payments/reservation-sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new BffRequestError(`Payment session failed with ${res.status}`, res.status);
  }

  return ReservationPaymentSessionSchema.parse(await res.json());
}

export async function getPreCheckInWorkflow(
  reservationId: string,
): Promise<PreCheckInWorkflow> {
  const res = await fetch(
    `${getPublicBffUrl()}/journeys/pre-check-in/${encodeURIComponent(reservationId)}`,
  );

  if (!res.ok) {
    throw new BffRequestError(`Pre-check-in failed with ${res.status}`, res.status);
  }

  return PreCheckInWorkflowSchema.parse(await res.json());
}

export async function submitPreCheckInWorkflow(
  input: SubmitPreCheckInWorkflow,
): Promise<PreCheckInWorkflow> {
  const payload = SubmitPreCheckInWorkflowSchema.parse(input);

  const res = await fetch(`${getPublicBffUrl()}/journeys/pre-check-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new BffRequestError(`Pre-check-in submit failed with ${res.status}`, res.status);
  }

  return PreCheckInWorkflowSchema.parse(await res.json());
}

export async function getIdentityVerificationWorkflow(
  reservationId: string,
): Promise<IdentityVerificationWorkflow> {
  const res = await fetch(
    `${getPublicBffUrl()}/journeys/identity-verification/${encodeURIComponent(reservationId)}`,
  );

  if (!res.ok) {
    throw new BffRequestError(
      `Identity verification failed with ${res.status}`,
      res.status,
    );
  }

  return IdentityVerificationWorkflowSchema.parse(await res.json());
}

export async function startIdentityVerificationWorkflow(
  input: StartIdentityVerificationWorkflow,
): Promise<IdentityVerificationWorkflow> {
  const payload = StartIdentityVerificationWorkflowSchema.parse(input);

  const res = await fetch(
    `${getPublicBffUrl()}/journeys/identity-verification/start`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new BffRequestError(
      `Identity verification start failed with ${res.status}`,
      res.status,
    );
  }

  return IdentityVerificationWorkflowSchema.parse(await res.json());
}

export async function updateIdentityVerificationStatus(
  input: UpdateIdentityVerificationStatus,
): Promise<IdentityVerificationWorkflow> {
  const payload = UpdateIdentityVerificationStatusSchema.parse(input);

  const res = await fetch(
    `${getPublicBffUrl()}/journeys/identity-verification/status`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new BffRequestError(
      `Identity verification status failed with ${res.status}`,
      res.status,
    );
  }

  return IdentityVerificationWorkflowSchema.parse(await res.json());
}
